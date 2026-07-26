import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";

interface CreateBookingBody {
  propertyId: string;
  guestName: string;
  guestSurname: string;
  guestEmail: string;
  guestPhone: string;
  guestAddress: string;
  guestsCount: number;
  checkIn: string; // "YYYY-MM-DD"
  checkOut: string; // "YYYY-MM-DD"
}

// POST /api/bookings
// 1. verifica che le date richieste siano libere (no overlap con bookings attivi o blocked dates)
// 2. crea la Booking con status PENDING
// 3. avvia il checkout tramite il payment provider configurato (mock o stripe)
// 4. ritorna l'url a cui reindirizzare l'ospite per pagare
export async function POST(req: NextRequest) {
  const body = (await req.json()) as CreateBookingBody;
  const {
    propertyId,
    guestName,
    guestSurname,
    guestEmail,
    guestPhone,
    guestAddress,
    guestsCount,
    checkIn,
    checkOut,
  } = body;

  if (
    !propertyId ||
    !guestName ||
    !guestSurname ||
    !guestEmail ||
    !guestPhone ||
    !guestAddress ||
    !guestsCount ||
    !checkIn ||
    !checkOut
  ) {
    return NextResponse.json(
      {
        error:
          "Campi mancanti: propertyId, guestName, guestSurname, guestEmail, guestPhone, guestAddress, guestsCount, checkIn, checkOut",
      },
      { status: 400 }
    );
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate <= checkInDate) {
    return NextResponse.json(
      { error: "checkOut deve essere successivo a checkIn" },
      { status: 400 }
    );
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return NextResponse.json({ error: "Casa non trovata" }, { status: 404 });
  }

  if (guestsCount > property.maxGuests) {
    return NextResponse.json(
      { error: `Questa casa ospita al massimo ${property.maxGuests} persone` },
      { status: 400 }
    );
  }

  // Un giorno è occupato se cade dentro [checkIn, checkOut) di un'altra prenotazione attiva,
  // oppure se è tra le date bloccate manualmente/da iCal.
  const overlappingBooking = await prisma.booking.findFirst({
    where: {
      propertyId,
      status: { in: ["PENDING", "CONFIRMED"] },
      checkIn: { lt: checkOutDate },
      checkOut: { gt: checkInDate },
    },
  });

  if (overlappingBooking) {
    return NextResponse.json(
      { error: "Le date selezionate non sono più disponibili" },
      { status: 409 }
    );
  }

  const blockedInRange = await prisma.blockedDate.findFirst({
    where: {
      propertyId,
      date: { gte: checkInDate, lt: checkOutDate },
    },
  });

  if (blockedInRange) {
    return NextResponse.json(
      { error: "Alcune date selezionate risultano bloccate" },
      { status: 409 }
    );
  }

  const nights = Math.round(
    (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalPrice = Number(property.basePrice) * nights;

  const booking = await prisma.booking.create({
    data: {
      propertyId,
      guestName,
      guestSurname,
      guestEmail,
      guestPhone,
      guestAddress,
      guestsCount,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      totalPrice,
      status: "PENDING",
    },
  });

  const paymentProvider = getPaymentProvider();
  const checkout = await paymentProvider.createCheckout({
    bookingId: booking.id,
    amount: Math.round(totalPrice * 100), // in centesimi
    currency: property.currency,
    customerEmail: guestEmail,
    description: `Prenotazione ${property.name}, ${checkIn} - ${checkOut} (${guestName} ${guestSurname})`,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { paymentRef: checkout.reference },
  });

  return NextResponse.json({
    bookingId: booking.id,
    totalPrice,
    checkoutUrl: checkout.checkoutUrl,
  });
}
