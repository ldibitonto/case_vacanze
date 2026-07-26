import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/properties/[slug]/availability
//   -> ritorna l'elenco di date NON disponibili (bloccate manualmente,
//      importate da iCal, oppure coperte da una prenotazione attiva)
// Il frontend usa questa lista per disabilitare i giorni nel calendario.
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const property = await prisma.property.findUnique({
    where: { slug: params.slug },
  });

  if (!property) {
    return NextResponse.json({ error: "Casa non trovata" }, { status: 404 });
  }

  const [blockedDates, activeBookings] = await Promise.all([
    prisma.blockedDate.findMany({
      where: { propertyId: property.id },
      select: { date: true, source: true },
    }),
    prisma.booking.findMany({
      where: {
        propertyId: property.id,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { checkIn: true, checkOut: true, status: true },
    }),
  ]);

  return NextResponse.json({
    propertyId: property.id,
    blockedDates,
    activeBookings,
  });
}
