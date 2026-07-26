import type { Amenity } from "./mockProperties";

// Catalogo condiviso dei servizi/amenità selezionabili da /admin/properties
// (checkbox) e mostrati nella pagina dettaglio casa (icone + popup "Mostra
// tutti"). Un'unica fonte di verità per valore, etichetta italiana e gruppo,
// così l'admin e la pagina pubblica restano sempre allineati.

export type AmenityGroupId = "principali" | "esterni" | "extra";

export const AMENITY_GROUP_LABELS: Record<AmenityGroupId, string> = {
  principali: "Servizi principali",
  esterni: "Spazi esterni",
  extra: "Caratteristiche extra",
};

export const AMENITY_CATALOG: { value: Amenity; label: string; group: AmenityGroupId }[] = [
  // Servizi principali
  { value: "pool", label: "Piscina privata", group: "principali" },
  { value: "dishwasher", label: "Lavastoviglie", group: "principali" },
  { value: "washer", label: "Lavatrice", group: "principali" },
  { value: "tv", label: "TV", group: "principali" },
  { value: "ac", label: "Aria condizionata", group: "principali" },
  { value: "wifi", label: "Internet", group: "principali" },
  { value: "microwave", label: "Microonde", group: "principali" },
  { value: "crib", label: "Culla", group: "principali" },
  { value: "pets", label: "Animali ammessi", group: "principali" },
  { value: "no-smoking", label: "Non fumatori", group: "principali" },
  { value: "kitchen", label: "Cucina", group: "principali" },
  { value: "bbq", label: "Barbecue", group: "principali" },
  { value: "hairdryer", label: "Asciugacapelli", group: "principali" },
  { value: "coffee-machine", label: "Macchina per caffè", group: "principali" },
  { value: "heating", label: "Riscaldamento", group: "principali" },
  { value: "fridge", label: "Frigorifero", group: "principali" },
  { value: "freezer", label: "Freezer", group: "principali" },
  { value: "mountain-view", label: "Vista sulle montagne", group: "principali" },
  { value: "parking", label: "Parcheggio", group: "principali" },
  { value: "smoke-detector", label: "Rilevatore di fumo", group: "principali" },
  { value: "fenced", label: "Recintato", group: "principali" },

  // Spazi esterni
  { value: "terrace", label: "Terrazza/balcone", group: "esterni" },
  { value: "garden", label: "Giardino", group: "esterni" },
  { value: "garden-furniture", label: "Mobili da giardino", group: "esterni" },

  // Caratteristiche extra
  { value: "sea-view", label: "Vista mare", group: "extra" },
  { value: "winter-ready", label: "Idonea anche per l'inverno", group: "extra" },
];

export const AMENITY_LABELS: Record<string, string> = Object.fromEntries(
  AMENITY_CATALOG.map((a) => [a.value, a.label])
);

export function amenityGroups() {
  const groups: { id: AmenityGroupId; label: string; items: typeof AMENITY_CATALOG }[] = (
    ["principali", "esterni", "extra"] as AmenityGroupId[]
  ).map((id) => ({
    id,
    label: AMENITY_GROUP_LABELS[id],
    items: AMENITY_CATALOG.filter((a) => a.group === id),
  }));
  return groups;
}
