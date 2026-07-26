import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface RangeBody {
  propertyId: string;
  checkIn: string; // "YYYY-MM-DD", incluso
  checkOut: string; // "YYYY-MM-DD", escluso (stessa convenzione di /api/bookings)
}

function eachDate(checkIn: string, checkOut: string) {
  const dates: Date[] = [];
  const current = new Date(checkIn);
  const end = new Date(checkOut);
  while (current < end) {
    dates.push(new Date(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function validateRange(body: Partial<RangeBody>) {
  const { propertyId, checkIn, checkOut } = body;
  if (!propertyId || !checkIn || !checkOut) {
    return "Campi mancanti: propertyId, checkIn, checkOut";
  }
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (
    Number.isNaN(checkInDate.getTime()) ||
    Number.isNaN(checkOutDate.getTime()) ||
    checkOutDate <= checkInDate
  ) {
    return "Intervallo date non valido";
  }
  return null;
}

// POST /api/admin/blocked-dates
// Blocca manualmente un intervallo di date per una casa (es. manutenzione,
// uso personale...), creando una BlockedDate per ogni giorno del range.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<RangeBody>;
  const error = validateRange(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { propertyId, checkIn, checkOut } = body as RangeBody;

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return NextResponse.json({ error: "Casa non trovata" }, { status: 404 });
  }

  const dates = eachDate(checkIn, checkOut);

  await prisma.blockedDate.createMany({
    data: dates.map((date) => ({ propertyId, date, source: "manual" })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true, blockedDays: dates.length });
}

// DELETE /api/admin/blocked-dates
// Sblocca un intervallo precedentemente bloccato manualmente. Tocca solo le
// BlockedDate con source "manual", per non toccare eventuali importazioni
// iCal future.
export async function DELETE(req: NextRequest) {
  const body = (await req.json()) as Partial<RangeBody>;
  const error = validateRange(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const { propertyId, checkIn, checkOut } = body as RangeBody;

  const result = await prisma.blockedDate.deleteMany({
    where: {
      propertyId,
      source: "manual",
      date: { gte: new Date(checkIn), lt: new Date(checkOut) },
    },
  });

  return NextResponse.json({ ok: true, deleted: result.count });
}
