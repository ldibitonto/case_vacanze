import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendReviewRequestEmail } from "@/lib/email";

// POST /api/admin/bookings/[id]/request-review
// Da usare SOLO dopo che l'admin si è accertato che il soggiorno sia
// concluso: genera un token a uso singolo e invia all'ospite l'email con il
// link a /recensione/[token]. Può essere richiamato più volte per
// "rinviare" l'email (rigenera un nuovo token ogni volta, invalidando link
// precedenti non ancora usati).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { property: true, review: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Prenotazione non trovata" }, { status: 404 });
  }

  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Solo le prenotazioni confermate possono ricevere una richiesta di recensione." },
      { status: 400 }
    );
  }

  if (booking.review) {
    return NextResponse.json(
      { error: "Questa prenotazione ha già una recensione." },
      { status: 400 }
    );
  }

  // Confronto per DATA (non per istante esatto): un checkout previsto
  // "oggi" deve poter ricevere la richiesta già da subito, non solo a
  // partire dalla mezzanotte UTC del giorno successivo.
  const now = new Date();
  const endOfToday = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
  );
  if (booking.checkOut.getTime() > endOfToday.getTime()) {
    return NextResponse.json(
      { error: "Il soggiorno non è ancora terminato: potrai inviare la richiesta dopo il check-out." },
      { status: 400 }
    );
  }

  const token = randomBytes(24).toString("hex");

  await prisma.booking.update({
    where: { id: booking.id },
    data: { reviewToken: token, reviewRequestedAt: new Date() },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const reviewUrl = `${baseUrl}/recensione/${token}`;

  const result = await sendReviewRequestEmail({
    to: booking.guestEmail,
    guestName: `${booking.guestName} ${booking.guestSurname}`.trim(),
    propertyName: booking.property.name,
    checkIn: booking.checkIn.toLocaleDateString("it-IT"),
    checkOut: booking.checkOut.toLocaleDateString("it-IT"),
    reviewUrl,
  });

  if (!result.sent) {
    return NextResponse.json({
      ok: true,
      emailSent: false,
      reason: result.reason,
      reviewUrl,
    });
  }

  return NextResponse.json({ ok: true, emailSent: true, reviewUrl });
}
