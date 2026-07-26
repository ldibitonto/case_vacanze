import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/reviews/[token] — usata dalla pagina pubblica /recensione/[token]
// per mostrare i dati del soggiorno prima di far scrivere la recensione.
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { reviewToken: params.token },
    include: { property: true, review: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Link non valido o scaduto." }, { status: 404 });
  }

  if (booking.review) {
    return NextResponse.json({ alreadyReviewed: true });
  }

  return NextResponse.json({
    alreadyReviewed: false,
    propertyName: booking.property.name,
    guestName: `${booking.guestName} ${booking.guestSurname}`.trim(),
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
  });
}

interface SubmitBody {
  guestName?: string;
  rating: number;
  comment: string;
}

// POST /api/reviews/[token] — invia la recensione. Il token è a uso singolo:
// una volta usato viene azzerato sul Booking (Review.bookingId è comunque
// unique, quindi anche un doppio invio concorrente non potrebbe creare due
// recensioni per la stessa prenotazione).
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { reviewToken: params.token },
    include: { review: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Link non valido o scaduto." }, { status: 404 });
  }

  if (booking.review) {
    return NextResponse.json({ error: "Hai già inviato una recensione per questo soggiorno." }, { status: 409 });
  }

  const body = (await req.json()) as Partial<SubmitBody>;
  const rating = Number(body.rating);
  const comment = (body.comment ?? "").trim();
  const guestName = (body.guestName ?? `${booking.guestName} ${booking.guestSurname}`).trim();

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Valutazione non valida (1-5)." }, { status: 400 });
  }
  if (!comment) {
    return NextResponse.json({ error: "Il commento non può essere vuoto." }, { status: 400 });
  }

  await prisma.review.create({
    data: {
      propertyId: booking.propertyId,
      bookingId: booking.id,
      guestName,
      rating: Math.round(rating),
      comment,
    },
  });

  // Token a uso singolo: una volta creata la recensione non è più valido.
  await prisma.booking.update({
    where: { id: booking.id },
    data: { reviewToken: null },
  });

  return NextResponse.json({ ok: true });
}
