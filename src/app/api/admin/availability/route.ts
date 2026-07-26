import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Fine della giornata odierna in UTC (23:59:59.999): usata per includere
// nei "soggiorni conclusi" anche i checkout previsti per oggi, dato che
// checkIn/checkOut sono colonne @db.Date (salvate a mezzanotte UTC).
function endOfTodayUTC() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
}

// GET /api/admin/availability?propertyId=...
// Ritorna, per una singola casa: i blocchi manuali (raggruppati in range
// consecutivi, per una lettura più comoda in UI) e le prenotazioni attive
// (PENDING/CONFIRMED), che occupano comunque le date anche se non sono
// "blocchi manuali".
export async function GET(req: NextRequest) {
  const propertyId = req.nextUrl.searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json({ error: "Parametro mancante: propertyId" }, { status: 400 });
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) {
    return NextResponse.json({ error: "Casa non trovata" }, { status: 404 });
  }

  const [blockedDates, bookings, pastBookings] = await Promise.all([
    prisma.blockedDate.findMany({
      where: { propertyId, source: "manual" },
      orderBy: { date: "asc" },
    }),
    prisma.booking.findMany({
      where: { propertyId, status: { in: ["PENDING", "CONFIRMED"] } },
      orderBy: { checkIn: "asc" },
    }),
    // Soggiorni CONFIRMED già conclusi: confrontiamo per DATA (non per
    // istante esatto), altrimenti un checkout previsto "oggi" resterebbe
    // escluso fino alla mezzanotte UTC del giorno dopo. Da qui l'admin può
    // inviare la richiesta di recensione via email.
    prisma.booking.findMany({
      where: { propertyId, status: "CONFIRMED", checkOut: { lte: endOfTodayUTC() } },
      orderBy: { checkOut: "desc" },
      include: { review: true },
    }),
  ]);

  // Raggruppa le date bloccate consecutive in range { start, end } (end
  // esclusivo, stessa convenzione di checkIn/checkOut usata nel resto
  // dell'app) per non mostrare centinaia di righe singole in UI.
  const ranges: { start: string; end: string }[] = [];
  for (const b of blockedDates) {
    const day = b.date.toISOString().slice(0, 10);
    const last = ranges[ranges.length - 1];
    if (last) {
      const lastEnd = new Date(last.end);
      const thisDay = new Date(day);
      if (lastEnd.getTime() === thisDay.getTime()) {
        // giorno consecutivo: estendi il range corrente
        const next = new Date(thisDay);
        next.setUTCDate(next.getUTCDate() + 1);
        last.end = next.toISOString().slice(0, 10);
        continue;
      }
    }
    const end = new Date(day);
    end.setUTCDate(end.getUTCDate() + 1);
    ranges.push({ start: day, end: end.toISOString().slice(0, 10) });
  }

  return NextResponse.json({
    property: {
      id: property.id,
      name: property.name,
      slug: property.slug,
      maxGuests: property.maxGuests,
      basePrice: property.basePrice,
      currency: property.currency,
    },
    blockedRanges: ranges,
    bookings: bookings.map((b) => ({
      id: b.id,
      guestName: `${b.guestName} ${b.guestSurname}`.trim(),
      guestEmail: b.guestEmail,
      checkIn: b.checkIn.toISOString().slice(0, 10),
      checkOut: b.checkOut.toISOString().slice(0, 10),
      status: b.status,
    })),
    pastBookings: pastBookings.map((b) => ({
      id: b.id,
      guestName: `${b.guestName} ${b.guestSurname}`.trim(),
      guestEmail: b.guestEmail,
      checkIn: b.checkIn.toISOString().slice(0, 10),
      checkOut: b.checkOut.toISOString().slice(0, 10),
      reviewRequestedAt: b.reviewRequestedAt ? b.reviewRequestedAt.toISOString() : null,
      hasReview: Boolean(b.review),
      reviewRating: b.review?.rating ?? null,
    })),
  });
}
