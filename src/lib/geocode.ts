// Geocoding gratuito via Nominatim (OpenStreetMap): converte un indirizzo
// testuale in coordinate lat/lng, senza bisogno di chiavi API.
//
// Politica di utilizzo di Nominatim: richiede uno User-Agent identificativo
// e massimo ~1 richiesta al secondo. Va bene per il volume di questa app
// (poche proprietà, geocodificate una volta sola e poi salvate in DB).
// https://operations.osmfoundation.org/policies/nominatim/

export type Coordinates = { lat: number; lng: number };

// Sigle provinciali italiane -> nome del capoluogo, usato per dare più
// contesto a Nominatim quando l'indirizzo contiene una sigla tra parentesi
// (es. "Druento (TO)" diventa "Druento, Torino"), invece di scartarla e
// basta: aiuta a disambiguare toponimi comuni a più regioni.
const PROVINCE_CODES: Record<string, string> = {
  AG: "Agrigento", AL: "Alessandria", AN: "Ancona", AO: "Aosta", AR: "Arezzo",
  AP: "Ascoli Piceno", AT: "Asti", AV: "Avellino", BA: "Bari", BT: "Barletta",
  BL: "Belluno", BN: "Benevento", BG: "Bergamo", BI: "Biella", BO: "Bologna",
  BZ: "Bolzano", BS: "Brescia", BR: "Brindisi", CA: "Cagliari", CL: "Caltanissetta",
  CB: "Campobasso", CE: "Caserta", CT: "Catania", CZ: "Catanzaro", CH: "Chieti",
  CO: "Como", CS: "Cosenza", CR: "Cremona", KR: "Crotone", CN: "Cuneo",
  EN: "Enna", FM: "Fermo", FE: "Ferrara", FI: "Firenze", FG: "Foggia",
  FC: "Forlì", FR: "Frosinone", GE: "Genova", GO: "Gorizia", GR: "Grosseto",
  IM: "Imperia", IS: "Isernia", SP: "La Spezia", AQ: "L'Aquila", LT: "Latina",
  LE: "Lecce", LC: "Lecco", LI: "Livorno", LO: "Lodi", LU: "Lucca",
  MC: "Macerata", MN: "Mantova", MS: "Massa", MT: "Matera", ME: "Messina",
  MI: "Milano", MO: "Modena", MB: "Monza", NA: "Napoli", NO: "Novara",
  NU: "Nuoro", OR: "Oristano", PD: "Padova", PA: "Palermo", PR: "Parma",
  PV: "Pavia", PG: "Perugia", PU: "Pesaro", PE: "Pescara", PC: "Piacenza",
  PI: "Pisa", PT: "Pistoia", PN: "Pordenone", PZ: "Potenza", PO: "Prato",
  RG: "Ragusa", RA: "Ravenna", RC: "Reggio Calabria", RE: "Reggio Emilia", RI: "Rieti",
  RN: "Rimini", RM: "Roma", RO: "Rovigo", SA: "Salerno", SS: "Sassari",
  SV: "Savona", SI: "Siena", SR: "Siracusa", SO: "Sondrio", SU: "Sud Sardegna",
  TA: "Taranto", TE: "Teramo", TR: "Terni", TO: "Torino", TP: "Trapani",
  TN: "Trento", TV: "Treviso", TS: "Trieste", UD: "Udine", VA: "Varese",
  VE: "Venezia", VB: "Verbania", VC: "Vercelli", VR: "Verona", VV: "Vibo Valentia",
  VI: "Vicenza", VT: "Viterbo",
};

function cleanAddress(address: string): string {
  // "Druento (TO)" -> "Druento, Torino": la sigla da sola confonde il
  // parser di Nominatim, il nome del capoluogo invece aiuta a disambiguare.
  const expanded = address.replace(/\(([A-Z]{2})\)/g, (match, code: string) => {
    const province = PROVINCE_CODES[code];
    return province ? `, ${province}` : "";
  });

  return expanded
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function nominatimSearch(query: string): Promise<Coordinates | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim rifiuta richieste senza uno User-Agent identificabile.
        "User-Agent": "case-vacanze-app/1.0 (uso interno, demo locale)",
        "Accept-Language": "it",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const results = (await res.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) return null;

    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  }
}

// Prova l'indirizzo completo e, se Nominatim non trova nulla (tipico per
// indirizzi molto specifici/informali tipo "Frazione Alta, Valle di Susa"),
// scala progressivamente a versioni più generiche togliendo il primo
// segmento (via/frazione) finché non trova almeno la città/zona.
// Ogni tentativo è una richiesta separata a Nominatim: le distanziamo di
// ~1.1s per rispettarne la policy di utilizzo.
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const cleaned = cleanAddress(address);
  const withCountry = cleaned.toLowerCase().includes("italia") ? cleaned : `${cleaned}, Italia`;
  const segments = withCountry
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Si ferma prima di provare la sola "Italia": troppo generico per essere utile.
  for (let i = 0; i < Math.max(segments.length - 1, 1); i++) {
    const attempt = segments.slice(i).join(", ");
    const coords = await nominatimSearch(attempt);
    if (coords) return coords;
    if (i < segments.length - 2) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }

  return null;
}

// Geocodifica in sequenza (non in parallelo) rispettando ~1 richiesta/secondo,
// come richiesto dalla policy di Nominatim per un uso corretto del servizio.
export async function geocodeSequentially<T>(
  items: T[],
  getAddress: (item: T) => string
): Promise<Map<T, Coordinates | null>> {
  const results = new Map<T, Coordinates | null>();

  for (const item of items) {
    const coords = await geocodeAddress(getAddress(item));
    results.set(item, coords);
    if (items.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }
  }

  return results;
}
