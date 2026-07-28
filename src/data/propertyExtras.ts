import type { Amenity, Property } from "./mockProperties";

// Il DB (Prisma) contiene solo i dati "di prenotazione" (nome, slug, prezzo,
// ospiti max, indirizzo, coordinate...). Questi extra sono solo visivi (foto,
// amenità, rating, ecc.) e servono ad arricchire la card senza dover
// cambiare lo schema Prisma per cose puramente cosmetiche.
// Chiave = slug della Property nel DB (vedi prisma/seed.ts).
type PropertyExtra = {
  image: string;
  sqm: number;
  amenities: Amenity[];
  rating: number;
  reviews: number;
  promotedBy?: string;
};

export const propertyExtras: Record<string, PropertyExtra> = {
  "casa-piscina-sicilia": {
    image: "https://picsum.photos/seed/sicilia-pool/640/420",
    sqm: 60,
    amenities: ["pool", "parking", "wifi", "ac", "garden"],
    rating: 4.9,
    reviews: 5,
    promotedBy: "Booking.com",
  },
  "casa-terrazza-otranto": {
    image: "https://picsum.photos/seed/puglia-terrazza/640/420",
    sqm: 65,
    amenities: ["sea-view", "wifi", "ac", "kitchen"],
    rating: 4.5,
    reviews: 44,
    promotedBy: "Booking.com",
  },
  "villa-maddalena-sardegna": {
    image: "https://picsum.photos/seed/sardegna-villa/640/420",
    sqm: 110,
    amenities: ["pool", "garden", "parking", "wifi"],
    rating: 4.8,
    reviews: 21,
  },
  "casale-toscana": {
    image: "https://picsum.photos/seed/toscana-casale/640/420",
    sqm: 140,
    amenities: ["pool", "wifi", "parking", "pets", "kitchen"],
    rating: 4.7,
    reviews: 63,
  },
  "appartamento-como": {
    image: "https://picsum.photos/seed/como-lago/640/420",
    sqm: 55,
    amenities: ["wifi", "ac", "sea-view"],
    rating: 4.6,
    reviews: 32,
  },
  "trullo-valle-itria": {
    image: "https://picsum.photos/seed/puglia-trullo/640/420",
    sqm: 50,
    amenities: ["garden", "wifi", "parking", "kitchen"],
    rating: 4.9,
    reviews: 17,
  },
};

// Fallback per property nel DB che non hanno un extra dedicato (es. quelle
// già seedate in origine: "casa-girasole", "baita-stella-alpina"), così la
// homepage resta presentabile per qualunque Property venga aggiunta.
const fallbackPalette: PropertyExtra[] = [
  {
    image: "https://picsum.photos/seed/casa-fallback-1/640/420",
    sqm: 75,
    amenities: ["wifi", "parking", "garden"],
    rating: 4.6,
    reviews: 12,
  },
  {
    image: "https://picsum.photos/seed/casa-fallback-2/640/420",
    sqm: 90,
    amenities: ["wifi", "kitchen", "ac"],
    rating: 4.7,
    reviews: 9,
  },
];

// Centro Italia (Roma): usato solo se una property non ha ancora
// coordinate e la geocodifica non è riuscita (es. nessuna connessione).
// Esportato così page.tsx può salvarlo come fallback definitivo in DB e
// smettere di ritentare la geocodifica ad ogni caricamento della home.
export const FALLBACK_COORDS = { lat: 41.9028, lng: 12.4964 };

// Usato dall'email di conferma prenotazione (src/lib/email.ts). Preferisce
// sempre la foto reale caricata da /admin/properties (db.image); il fallback
// statico serve solo per le case demo storiche che non hanno mai avuto una
// foto propria salvata nel DB.
export function getDisplayImage(slug: string, dbImage?: string | null): string {
  return dbImage || propertyExtras[slug]?.image || fallbackPalette[0].image;
}

type DbProperty = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  maxGuests: number;
  basePrice: unknown; // Prisma.Decimal
  currency: string;
  lat?: number | null;
  lng?: number | null;
  // Presenti solo sulle Property create/modificate da /admin/properties
  // (o su vecchie righe dopo un aggiornamento manuale). Se assenti/vuoti,
  // si torna al fallback statico qui sotto per le case demo storiche.
  image?: string | null;
  images?: string[];
  amenities?: string[];
  rating?: number | null;
  reviews?: number | null;
  sqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  promotedBy?: string | null;
};

export function buildDisplayProperty(db: DbProperty, index: number): Property {
  const fallback = propertyExtras[db.slug] ?? fallbackPalette[index % fallbackPalette.length];

  return {
    id: db.id,
    slug: db.slug,
    title: db.name,
    location: db.address ?? "Italia",
    region: "",
    image: db.image || fallback.image,
    // Galleria per lo slider della card: le foto extra caricate da
    // /admin/properties, se ce ne sono; altrimenti solo la foto principale
    // (lo slider si comporta allora come una singola immagine statica).
    images: db.images && db.images.length > 0 ? db.images : undefined,
    sqm: db.sqm || fallback.sqm,
    guests: db.maxGuests,
    bedrooms: db.bedrooms || Math.max(1, Math.round(db.maxGuests / 2)),
    bathrooms: db.bathrooms || 1,
    amenities: db.amenities && db.amenities.length > 0 ? (db.amenities as Amenity[]) : fallback.amenities,
    rating: db.rating || fallback.rating,
    reviews: db.reviews ?? fallback.reviews,
    pricePerNight: Number(db.basePrice?.toString?.() ?? db.basePrice),
    currency: db.currency === "EUR" ? "€" : db.currency,
    promotedBy: db.promotedBy || fallback.promotedBy,
    lat: db.lat ?? FALLBACK_COORDS.lat,
    lng: db.lng ?? FALLBACK_COORDS.lng,
  };
}
