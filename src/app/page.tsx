import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { HomeSearchLayout } from "@/components/home/HomeSearchLayout";
import { mockProperties } from "@/data/mockProperties";
import { buildDisplayProperty, FALLBACK_COORDS } from "@/data/propertyExtras";
import { geocodeAddress } from "@/lib/geocode";
import { getReviewAggregates, withReviewAggregate } from "@/lib/reviews";

// Nominatim va rispettato con ~1 richiesta/secondo (vedi lib/geocode.ts):
// geocodificare tutte le case mancanti in un colpo solo, in un catalogo che
// ormai ne conta decine, richiederebbe più tempo del timeout della funzione
// serverless — e se la funzione viene interrotta a metà, quelle già
// geocodificate ma non ancora salvate andrebbero ripetute al giro
// successivo, restando bloccate per sempre. Per questo: (a) ne processiamo
// al massimo MAX_GEOCODE_PER_LOAD per caricamento, (b) salviamo ogni
// risultato subito dopo averlo calcolato invece di aspettare la fine del
// lotto. Con un catalogo grande bastano un paio di ricaricamenti della home
// perché tutte le case restanti ottengano una posizione reale sulla mappa.
const MAX_GEOCODE_PER_LOAD = 8;

// Pagina sempre dinamica: legge dal DB in tempo reale (disponibilità, case
// aggiunte in admin, recensioni appena arrivate...). Senza questa riga
// Next.js proverebbe a generarla come pagina statica in fase di build,
// congelando i dati al momento del deploy invece di mostrarli aggiornati.
export const dynamic = "force-dynamic";

// Homepage con layout ispirato ai portali di case vacanze (stile HomeToGo).
// I dati vengono letti dal DB reale (Prisma) e arricchiti con gli extra
// visivi (foto, amenità, rating...) definiti in src/data/propertyExtras.ts,
// così il bottone "Vai all'offerta" porta al vero flusso di prenotazione
// (/property/[slug] -> POST /api/bookings -> checkout mock).
export default async function HomePage() {
  const dbProperties = await prisma.property.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Geolocalizzazione: se una Property non ha ancora lat/lng, li calcoliamo
  // dal suo indirizzo (Nominatim/OpenStreetMap) e li salviamo in DB, così la
  // geocodifica avviene una sola volta per casa e la mappa mostra la
  // posizione reale invece di coordinate finte.
  const missingCoords = dbProperties
    .filter((p) => (p.lat == null || p.lng == null) && p.address)
    .slice(0, MAX_GEOCODE_PER_LOAD);

  for (const property of missingCoords) {
    const coords = await geocodeAddress(property.address as string);

    if (!coords) {
      // Anche se la geocodifica fallisce salviamo un fallback (Roma):
      // altrimenti lat/lng resta null e la home ritenta la geocodifica
      // (con le sue chiamate a Nominatim) ad OGNI caricamento, rendendo la
      // pagina lenta per sempre invece che una volta sola. Loggato per
      // diagnosticarlo; per riprovare un indirizzo dopo averlo corretto,
      // azzera lat/lng di quella Property da /admin o Prisma Studio.
      console.warn(
        `[geocode] Nessun risultato per "${property.address}" (property ${property.slug}). Uso una posizione di fallback, niente più retry automatici.`
      );
    }

    // Salvato subito, non alla fine del lotto: se la funzione viene
    // interrotta a metà (troppe case da geocodificare per il timeout della
    // funzione serverless), quanto già fatto resta comunque acquisito e il
    // prossimo caricamento riparte dalle sole case ancora mancanti.
    const { lat, lng } = coords ?? FALLBACK_COORDS;
    const updated = await prisma.property.update({
      where: { id: property.id },
      data: { lat, lng },
    });
    property.lat = updated.lat;
    property.lng = updated.lng;
  }

  // Se il DB è vuoto (es. prima del seed) mostriamo comunque il layout con
  // dati di esempio, così il design resta visibile; il click su "Vai
  // all'offerta" in quel caso non troverà una prenotazione reale finché non
  // viene eseguito `npm run db:seed`.
  // Se una casa ha già recensioni reali (vedi /recensione/[token]), il
  // rating/numero recensioni mostrato deve riflettere quelle, non il valore
  // statico impostato manualmente in /admin/properties.
  const reviewAggregates = await getReviewAggregates();

  const properties =
    dbProperties.length > 0
      ? dbProperties.map((p, i) =>
          buildDisplayProperty(withReviewAggregate(p, reviewAggregates), i)
        )
      : mockProperties;

  return (
    <Suspense fallback={null}>
      <HomeSearchLayout
        properties={properties}
        source={dbProperties.length > 0 ? "db" : "mock"}
      />
    </Suspense>
  );
}
