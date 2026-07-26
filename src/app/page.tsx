import { prisma } from "@/lib/db";
import { HomeSearchLayout } from "@/components/home/HomeSearchLayout";
import { mockProperties } from "@/data/mockProperties";
import { buildDisplayProperty, FALLBACK_COORDS } from "@/data/propertyExtras";
import { geocodeSequentially } from "@/lib/geocode";
import { getReviewAggregates, withReviewAggregate } from "@/lib/reviews";

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
  const missingCoords = dbProperties.filter(
    (p) => (p.lat == null || p.lng == null) && p.address
  );

  if (missingCoords.length > 0) {
    const geocoded = await geocodeSequentially(missingCoords, (p) => p.address as string);

    await Promise.all(
      Array.from(geocoded.entries()).map(async ([property, coords]) => {
        if (!coords) {
          // Anche se la geocodifica fallisce salviamo un fallback (Roma):
          // altrimenti lat/lng resta null e la home ritenta la geocodifica
          // (con le sue chiamate sequenziali a Nominatim) ad OGNI caricamento,
          // rendendo la pagina lenta per sempre invece che una volta sola.
          // Loggato per diagnosticarlo; per riprovare un indirizzo dopo averlo
          // corretto, azzera lat/lng di quella Property da /admin o Prisma Studio.
          console.warn(
            `[geocode] Nessun risultato per "${property.address}" (property ${property.slug}). Uso una posizione di fallback, niente più retry automatici.`
          );
        }

        const { lat, lng } = coords ?? FALLBACK_COORDS;
        const updated = await prisma.property.update({
          where: { id: property.id },
          data: { lat, lng },
        });
        property.lat = updated.lat;
        property.lng = updated.lng;
      })
    );
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
    <HomeSearchLayout
      properties={properties}
      source={dbProperties.length > 0 ? "db" : "mock"}
    />
  );
}
