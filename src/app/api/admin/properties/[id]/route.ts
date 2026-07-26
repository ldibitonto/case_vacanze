import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { uniqueSlug } from "@/lib/properties";

interface UpdateBody {
  name?: string;
  slug?: string;
  description?: string;
  address?: string;
  maxGuests?: number;
  basePrice?: number;
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

// PATCH /api/admin/properties/[id] — modifica una casa esistente.
// Se l'indirizzo cambia, azzeriamo lat/lng: verranno ricalcolate dal nuovo
// indirizzo al prossimo caricamento della home.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Casa non trovata" }, { status: 404 });
  }

  const body = (await req.json()) as UpdateBody;

  let slug = existing.slug;
  if (body.slug && slugify(body.slug) !== existing.slug) {
    slug = await uniqueSlug(slugify(body.slug), existing.id);
  }

  const addressChanged = body.address !== undefined && body.address !== existing.address;

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      name: body.name ?? existing.name,
      slug,
      description: body.description !== undefined ? body.description || null : existing.description,
      address: body.address !== undefined ? body.address || null : existing.address,
      maxGuests: body.maxGuests ?? existing.maxGuests,
      basePrice: body.basePrice ?? existing.basePrice,
      currency: body.currency ?? existing.currency,
      cin: body.cin !== undefined ? body.cin || null : existing.cin,
      image:
        body.image !== undefined
          ? body.image || (body.images && body.images[0]) || null
          : existing.image,
      images: body.images ?? existing.images,
      amenities: body.amenities ?? existing.amenities,
      rating: body.rating ?? existing.rating,
      reviews: body.reviews ?? existing.reviews,
      sqm: body.sqm ?? existing.sqm,
      bedrooms: body.bedrooms ?? existing.bedrooms,
      bathrooms: body.bathrooms ?? existing.bathrooms,
      promotedBy: body.promotedBy !== undefined ? body.promotedBy || null : existing.promotedBy,
      cancellationPolicy: body.cancellationPolicy ?? existing.cancellationPolicy,
      ...(addressChanged ? { lat: null, lng: null } : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/properties/[id]
// Rifiuta l'eliminazione se esistono prenotazioni collegate (per non perdere
// lo storico): in quel caso vanno prima gestite/annullate da /admin. I
// blocchi manuali delle date, invece, non hanno valore storico e vengono
// rimossi automaticamente.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const existing = await prisma.property.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Casa non trovata" }, { status: 404 });
  }

  const bookingsCount = await prisma.booking.count({ where: { propertyId: params.id } });
  if (bookingsCount > 0) {
    return NextResponse.json(
      {
        error: `Non puoi eliminare questa casa: ha ${bookingsCount} prenotazioni collegate. Annullale prima da /admin se necessario.`,
      },
      { status: 409 }
    );
  }

  await prisma.blockedDate.deleteMany({ where: { propertyId: params.id } });
  await prisma.property.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
