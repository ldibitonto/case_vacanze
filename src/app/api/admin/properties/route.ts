import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { uniqueSlug } from "@/lib/properties";

// Sempre dinamica, stesso motivo di /api/properties: nessun parametro
// Request qui dentro la renderebbe "static-eligible" per Next.js, che la
// congelerebbe in fase di build invece di leggere il DB ad ogni richiesta.
export const dynamic = "force-dynamic";

// GET /api/admin/properties — elenco completo per la UI di /admin/properties
export async function GET() {
  const properties = await prisma.property.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(properties);
}

interface CreateBody {
  name: string;
  slug?: string;
  description?: string;
  address?: string;
  maxGuests: number;
  basePrice: number;
  currency?: string;
  cin?: string;
  image?: string;
  images?: string[];
  amenities?: string[];
  rating?: number;
  reviews?: number;
  sqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  promotedBy?: string;
  cancellationPolicy?: string;
}

// POST /api/admin/properties — crea una nuova casa vacanza.
// lat/lng non vengono impostate qui: verranno geocodificate automaticamente
// dall'indirizzo al primo caricamento della home (vedi src/app/page.tsx).
export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<CreateBody>;

  if (!body.name || !body.maxGuests || body.basePrice == null) {
    return NextResponse.json(
      { error: "Campi mancanti: name, maxGuests, basePrice" },
      { status: 400 }
    );
  }

  const baseSlug = slugify(body.slug || body.name);
  const slug = await uniqueSlug(baseSlug);

  const property = await prisma.property.create({
    data: {
      name: body.name,
      slug,
      description: body.description || null,
      address: body.address || null,
      maxGuests: body.maxGuests,
      basePrice: body.basePrice,
      currency: body.currency || "EUR",
      cin: body.cin || null,
      image: body.image || (body.images && body.images[0]) || null,
      images: body.images ?? [],
      amenities: body.amenities ?? [],
      rating: body.rating ?? 4.8,
      reviews: body.reviews ?? 0,
      sqm: body.sqm ?? 50,
      bedrooms: body.bedrooms ?? 1,
      bathrooms: body.bathrooms ?? 1,
      promotedBy: body.promotedBy || null,
      ...(body.cancellationPolicy ? { cancellationPolicy: body.cancellationPolicy } : {}),
    },
  });

  return NextResponse.json(property, { status: 201 });
}
