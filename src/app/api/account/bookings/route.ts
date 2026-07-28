import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/guestAuth";

export const dynamic = "force-dynamic";

// GET /api/account/bookings — le prenotazioni dell'ospite loggato: non c'è
// un userId in Booking, il collegamento è semplicemente la stessa mail
// (Booking.guestEmail) usata per accedere.
export async function GET(req: NextRequest) {
  const email = verifySessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!email) {
    return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
  }

  const bookings = await prisma.booking.findMany({
    where: { guestEmail: email },
    include: { property: { select: { name: true, slug: true, image: true, currency: true } } },
    orderBy: { checkIn: "desc" },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      status: b.status,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guestsCount: b.guestsCount,
      totalPrice: b.totalPrice.toString(),
      currency: b.property.currency,
      propertyName: b.property.name,
      propertySlug: b.property.slug,
      propertyImage: b.property.image,
    }))
  );
}
