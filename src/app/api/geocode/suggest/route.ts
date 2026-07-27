import { NextRequest, NextResponse } from "next/server";

// GET /api/geocode/suggest?q=verona
// Autocomplete dei luoghi per la barra di ricerca della home: proxy verso
// Nominatim (OpenStreetMap, stesso servizio già usato in lib/geocode.ts per
// geocodificare gli indirizzi delle case). Serve un endpoint server-side
// perché Nominatim richiede uno User-Agent identificativo che il browser
// non può impostare lato client, e per evitare problemi di CORS.
//
// Limitato all'Italia (countrycodes=it): il sito propone solo case vacanza
// italiane, quindi suggerire città estere confonderebbe più che aiutare.
export const dynamic = "force-dynamic";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  address?: Record<string, string>;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=it&accept-language=it&q=${encodeURIComponent(
    q
  )}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "case-vacanze-app/1.0 (uso interno, demo locale)",
        "Accept-Language": "it",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const raw = (await res.json()) as NominatimResult[];

    const results = raw.map((r) => {
      const addr = r.address ?? {};
      // Il "nome principale" del suggerimento: città/paese, o in mancanza
      // la provincia/regione, o il primo pezzo del nome completo restituito.
      const label =
        addr.city || addr.town || addr.village || addr.hamlet || addr.county || addr.state ||
        r.display_name.split(",")[0].trim();

      // Il resto della gerarchia (provincia, regione, nazione) come sottotitolo,
      // escludendo il pezzo già usato come label per non ripeterlo.
      const parts = r.display_name
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p && p.toLowerCase() !== label.toLowerCase());

      return {
        label,
        sublabel: parts.join(", "),
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      };
    });

    // Dedup per label+sublabel (Nominatim a volte restituisce lo stesso
    // luogo con geometrie diverse, es. punto e poligono amministrativo).
    const seen = new Set<string>();
    const deduped = results.filter((r) => {
      const key = `${r.label.toLowerCase()}|${r.sublabel.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ results: deduped });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
