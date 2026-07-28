import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { demoSeedProperties } from "@/data/demoSeedProperties";

// GET /api/admin/seed-demo
// Endpoint "usa e getta" protetto da Basic Auth (vedi middleware.ts, che
// copre tutto /api/admin/:path*): popola il catalogo con ~30 case demo
// distribuite su tutte le regioni italiane (src/data/demoSeedProperties.ts),
// per avere un sito di prova con contenuti vari senza doverle inserire a
// mano una per una da /admin/properties. Basta visitarlo una volta dal
// browser (il login Basic Auth compare in automatico). Idempotente: se una
// casa con lo stesso slug esiste già viene saltata, quindi si può rivisitare
// l'URL più volte senza creare doppioni.
export const dynamic = "force-dynamic";

export async function GET() {
  const createdSlugs: string[] = [];
  const skippedSlugs: string[] = [];

  for (const p of demoSeedProperties) {
    const existing = await prisma.property.findUnique({ where: { slug: p.slug } });
    if (existing) {
      skippedSlugs.push(p.slug);
      continue;
    }

    await prisma.property.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        address: p.address,
        maxGuests: p.maxGuests,
        basePrice: p.basePrice,
        currency: p.currency,
        image: p.images[0],
        images: p.images,
        amenities: p.amenities,
        rating: p.rating,
        reviews: p.reviews,
        sqm: p.sqm,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
      },
    });
    createdSlugs.push(p.slug);
  }

  return NextResponse.json({
    created: createdSlugs.length,
    skipped: skippedSlugs.length,
    createdSlugs,
    skippedSlugs,
  });
}
