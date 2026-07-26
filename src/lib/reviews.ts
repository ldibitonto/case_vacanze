import { prisma } from "@/lib/db";

// Rating/numero recensioni "vetrina" (property.rating / property.reviews)
// sono valori impostati manualmente da /admin/properties, usati finché una
// casa non ha ancora recensioni reali. Appena arriva la prima recensione
// scritta da un ospite (vedi /recensione/[token]), il rating mostrato
// ovunque (home, mappa, pagina dettaglio, riepilogo prenotazione) deve
// riflettere la media reale invece del valore statico: questo helper calcola
// l'aggregato e va applicato a ogni endpoint che espone le Property.

export type ReviewAggregate = { avg: number; count: number };

export async function getReviewAggregates(): Promise<Map<string, ReviewAggregate>> {
  const rows = await prisma.review.groupBy({
    by: ["propertyId"],
    _avg: { rating: true },
    _count: { rating: true },
  });

  return new Map(
    rows.map((r) => [r.propertyId, { avg: r._avg.rating ?? 0, count: r._count.rating }])
  );
}

export function withReviewAggregate<T extends { id: string; rating: number; reviews: number }>(
  property: T,
  aggregates: Map<string, ReviewAggregate>
): T {
  const agg = aggregates.get(property.id);
  if (!agg || agg.count === 0) return property;
  return { ...property, rating: agg.avg, reviews: agg.count };
}
