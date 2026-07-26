import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/payments";
import { sendBookingConfirmationEmail } from "@/lib/email";
import { getDisplayImage } from "@/data/propertyExtras";

interface ConfirmBody {
  bookingId: string;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
}

// POST /api/bookings/confirm
// Con il mock, questo endpoint viene chiamato dalla pagina /mock-checkout
// quando l'utente clicca "Simula pagamento riuscito".
// Con Stripe reale, questa logica verrà chiamata da un webhook
// (es. checkout.session.completed) invece che da un click dell'utente.
export async function POST(req: NextRequest) {
  const { bookingId } = (await req.json()) as ConfirmBody;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });
  }

  if (!booking.paymentRef) {
    return NextResponse.json(
      { error: "Nessun riferimento di pagamento associato a questa prenotazione" },
      { status: 400 }
    );
  }

  const paymentProvider = getPaymentProvider();
  const status = await paymentProvider.verifyPayment(booking.paymentRef);

  const newStatus = status === "paid" ? "CONFIRMED" : "CANCELLED";

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: newStatus },
  });

  if (newStatus === "CONFIRMED") {
    // L'email è un "nice to have" rispetto alla prenotazione già confermata:
    // un problema nell'invio (chiave mancante, Resend giù, ecc.) viene solo
    // loggato e non deve far fallire la risposta all'utente.
    try {
      const property = await prisma.property.findUnique({ where: { id: updated.propertyId } });
      if (property) {
        await sendBookingConfirmationEmail({
          to: updated.guestEmail,
          guestName: `${updated.guestName} ${updated.guestSurname}`.trim(),
          bookingId: updated.id,
          propertyName: property.name,
          propertyImage: getDisplayImage(property.slug, property.image),
          checkIn: formatDate(updated.checkIn),
          checkOut: formatDate(updated.checkOut),
          totalPrice: Number(updated.totalPrice),
          currency: property.currency,
        });
      }
    } catch (err) {
      console.error("[email] Invio conferma fallito:", err);
    }
  }

  return NextResponse.json({ bookingId: updated.id, status: updated.status });
}
