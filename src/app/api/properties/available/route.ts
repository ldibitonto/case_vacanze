import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/properties/available?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
// Ritorna gli id delle Property libere per l'intero intervallo richiesto.
// Una Property è considerata occupata se ha una Booking attiva
// (PENDING/CONFIRMED) che si sovrappone alle date, oppure una BlockedDate
// che cade nel range: stessa logica di controllo overlap usata in
// POST /api/bookings, ma applicata a tutte le proprietà in un colpo solo
// (serve al filtro date della homepage).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!checkIn || !checkOut) {
    return NextResponse.json(
      { error: "Parametri mancanti: checkIn, checkOut" },
      { status: 400 }
    );
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime()) ||
    checkOutDate <= checkInDate
  ) {
    return NextResponse.json({ error: "Intervallo date non valido" }, { status: 400 });
  }

  const [properties, overlappingBookings, blockedInRange] = await Promise.all([
    prisma.property.findMany({ select: { id: true } }),
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
      select: { propertyId: true },
    }),
    prisma.blockedDate.findMany({
      where: { date: { gte: checkInDate, lt: checkOutDate } },
      select: { propertyId: true },
    }),
  ]);

  const unavailableIds = new Set<string>([
    ...overlappingBookings.map((b) => b.propertyId),
    ...blockedInRange.map((b) => b.propertyId),
  ]);

  const availablePropertyIds = properties
    .map((p) => p.id)
    .filter((id) => !unavailableIds.has(id));

  return NextResponse.json({ availablePropertyIds });
}
