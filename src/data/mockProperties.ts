export type Amenity =
  | "wifi"
  | "parking"
  | "pool"
  | "ac"
  | "pets"
  | "kitchen"
  | "sea-view"
  | "garden"
  | "dishwasher"
  | "washer"
  | "tv"
  | "microwave"
  | "crib"
  | "no-smoking"
  | "bbq"
  | "hairdryer"
  | "coffee-machine"
  | "heating"
  | "fridge"
  | "freezer"
  | "mountain-view"
  | "smoke-detector"
  | "fenced"
  | "terrace"
  | "garden-furniture"
  | "winter-ready";

export type Property = {
  id: string;
  slug: string;
  title: string;
  location: string;
  region: string;
  image: string;
  sqm: number;
  guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: Amenity[];
  rating: number;
  reviews: number;
  pricePerNight: number;
  currency: string;
  promotedBy?: string;
  // Coordinate reali (geocodificate dall'indirizzo, vedi src/lib/geocode.ts
  // e src/data/propertyExtras.ts), usate dalla mappa interattiva.
  lat: number;
  lng: number;
};

export const mockProperties: Property[] = [
  {
    id: "1",
    slug: "casa-piscina-sicilia",
    title: "Casa con piscina privata, barbecue e terrazza | Vista sul mare",
    location: "Sicilia",
    region: "Sud Italia",
    image: "https://picsum.photos/seed/sicilia-pool/640/420",
    sqm: 60,
    guests: 7,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["pool", "parking", "wifi", "ac", "garden"],
    rating: 4.9,
    reviews: 5,
    pricePerNight: 112,
    currency: "€",
    promotedBy: "Booking.com",
    lat: 38.0459,
    lng: 14.0229,
  },
  {
    id: "2",
    slug: "casa-terrazza-otranto",
    title: "Bellissima casa con terrazza | Vista sul giardino | Accanto al mare",
    location: "Otranto, Puglia",
    region: "Sud Italia",
    image: "https://picsum.photos/seed/puglia-terrazza/640/420",
    sqm: 65,
    guests: 4,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["sea-view", "wifi", "ac", "kitchen"],
    rating: 4.5,
    reviews: 44,
    pricePerNight: 70,
    currency: "€",
    promotedBy: "Booking.com",
    lat: 40.1462,
    lng: 18.4881,
  },
  {
    id: "3",
    slug: "villa-maddalena-sardegna",
    title: "Spaziosa villa totalmente attrezzata con giardino e piscina",
    location: "La Maddalena, Sardegna",
    region: "Isole",
    image: "https://picsum.photos/seed/sardegna-villa/640/420",
    sqm: 110,
    guests: 5,
    bedrooms: 2,
    bathrooms: 2,
    amenities: ["pool", "garden", "parking", "wifi"],
    rating: 4.8,
    reviews: 21,
    pricePerNight: 148,
    currency: "€",
    lat: 41.2148,
    lng: 9.4048,
  },
  {
    id: "4",
    slug: "casale-toscana",
    title: "Casale in pietra tra le colline | Piscina panoramica",
    location: "Val d'Orcia, Toscana",
    region: "Centro Italia",
    image: "https://picsum.photos/seed/toscana-casale/640/420",
    sqm: 140,
    guests: 8,
    bedrooms: 4,
    bathrooms: 3,
    amenities: ["pool", "wifi", "parking", "pets", "kitchen"],
    rating: 4.7,
    reviews: 63,
    pricePerNight: 189,
    currency: "€",
    lat: 43.0667,
    lng: 11.6167,
  },
  {
    id: "5",
    slug: "appartamento-como",
    title: "Appartamento fronte lago con balcone privato",
    location: "Lago di Como, Lombardia",
    region: "Nord Italia",
    image: "https://picsum.photos/seed/como-lago/640/420",
    sqm: 55,
    guests: 3,
    bedrooms: 1,
    bathrooms: 1,
    amenities: ["wifi", "ac", "sea-view"],
    rating: 4.6,
    reviews: 32,
    pricePerNight: 96,
    currency: "€",
    lat: 45.9847,
    lng: 9.2565,
  },
  {
    id: "6",
    slug: "trullo-valle-itria",
    title: "Trullo tipico ristrutturato con giardino privato",
    location: "Valle d'Itria, Puglia",
    region: "Sud Italia",
    image: "https://picsum.photos/seed/puglia-trullo/640/420",
    sqm: 50,
    guests: 4,
    bedrooms: 2,
    bathrooms: 1,
    amenities: ["garden", "wifi", "parking", "kitchen"],
    rating: 4.9,
    reviews: 17,
    pricePerNight: 85,
    currency: "€",
    lat: 40.7833,
    lng: 17.3333,
  },
];
