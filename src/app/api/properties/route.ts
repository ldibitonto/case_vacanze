import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getReviewAggregates, withReviewAggregate } from "@/lib/reviews";

// GET /api/properties -> lista delle case vacanza pubblicate
export async function GET() {
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Se una casa ha già recensioni reali, il rating/numero recensioni deve
  // riflettere quelle invece del valore statico impostato in admin (vedi
  // src/lib/reviews.ts).
  const reviewAggregates = await getReviewAggregates();
  const merged = properties.map((p) => withReviewAggregate(p, reviewAggregates));

  return NextResponse.json(merged);
}
