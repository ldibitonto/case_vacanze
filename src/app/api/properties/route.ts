import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getReviewAggregates, withReviewAggregate } from "@/lib/reviews";

// Sempre dinamica: senza dichiararlo, Next.js proverebbe a pre-generare
// questa risposta una sola volta in fase di build (nessun parametro Request
// in ingresso la rende "static-eligible"), congelando la lista case al
// momento del deploy invece di leggerla dal DB ad ogni richiesta.
export const dynamic = "force-dynamic";

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
