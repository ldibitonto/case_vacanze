import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/properties/[slug]/reviews — recensioni pubblicate per una casa,
// mostrate nel tab "Recensioni" della pagina dettaglio.
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const property = await prisma.property.findUnique({ where: { slug: params.slug } });

  if (!property) {
    return NextResponse.json({ error: "Casa non trovata" }, { status: 404 });
  }

  const reviews = await prisma.review.findMany({
    where: { propertyId: property.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    reviews.map((r) => ({
      id: r.id,
      guestName: r.guestName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
    }))
  );
}
