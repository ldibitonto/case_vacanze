import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/admin/bookings/[id]/cancel
// Segna una prenotazione come CANCELLED, liberando quelle date per nuove
// richieste (sia il check overlap di POST /api/bookings sia il filtro
// GET /api/properties/available escludono solo PENDING/CONFIRMED).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) {
    return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id: params.id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
