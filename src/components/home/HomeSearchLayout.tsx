"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./HomeSearchLayout.module.css";
import { SearchBar } from "./SearchBar";
import { PropertyCard } from "./PropertyCard";
import { MapPreview } from "./MapPreview";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { FilterPanel, EMPTY_FILTERS, countActiveFilters, matchesFilters } from "./FilterPanel";
import type { FiltersState } from "./FilterPanel";
import { MenuIcon } from "./icons";
import type { Amenity, Property } from "@/data/mockProperties";
import { REGION_PROVINCE_CODES } from "@/data/regions";

function matchesLocation(p: Property, query: string) {
  const q = query.trim().toLowerCase();
  if (!q || q === "italia") return true;

  if (p.location.toLowerCase().includes(q)) return true;

  // Il testo digitato è il nome di una regione (es. "Trentino-Alto Adige")
  // ma l'indirizzo è puntuale e non la nomina mai per esteso: proviamo a
  // riconoscerla dalla sigla provincia in coda all'indirizzo (es. "BZ").
  const provinceCodes = REGION_PROVINCE_CODES[q];
  if (provinceCodes) {
    const addr = p.location.toUpperCase();
    return provinceCodes.some((code) => new RegExp(`\\b${code}\\b`).test(addr));
  }

  return false;
}

export function HomeSearchLayout({
  properties,
  source = "db",
}: {
  properties: Property[];
  source?: "db" | "mock";
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [location, setLocation] = useState("Italia");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [availableIds, setAvailableIds] = useState<Set<string> | null>(null);
  const [checking, setChecking] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(EMPTY_FILTERS);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const petsAllowed = filters.amenities.includes("pets");

  function handleChangeGuests(next: { adults: number; children: number; petsAllowed: boolean }) {
    setFilters((f) => ({
      ...f,
      adults: next.adults,
      children: next.children,
      amenities: next.petsAllowed
        ? Array.from(new Set([...f.amenities, "pets" as Amenity]))
        : f.amenities.filter((a) => a !== "pets"),
    }));
  }

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailableIds(null);
      setDateError(null);
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setAvailableIds(null);
      setDateError("Il check-out deve essere successivo al check-in.");
      return;
    }

    if (source !== "db") {
      // In modalità demo (nessuna casa nel DB) non c'è nulla da controllare:
      // mostriamo un avviso invece di filtrare i dati finti.
      setAvailableIds(null);
      setDateError(null);
      return;
    }

    setDateError(null);
    setChecking(true);
    const controller = new AbortController();

    fetch(`/api/properties/available?checkIn=${checkIn}&checkOut=${checkOut}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data: { availablePropertyIds?: string[]; error?: string }) => {
        if (data.availablePropertyIds) {
          setAvailableIds(new Set(data.availablePropertyIds));
        } else {
          setDateError(data.error ?? "Errore nel controllo disponibilità.");
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setDateError("Errore nel controllo disponibilità.");
        }
      })
      .finally(() => setChecking(false));

    return () => controller.abort();
  }, [checkIn, checkOut, source]);

  const datesSelected = Boolean(checkIn && checkOut);

  // Senza memo, questi due array vengono ricreati (nuovo riferimento) a ogni
  // render, anche quando il contenuto non cambia — es. mentre si clicca la
  // data di arrivo nel calendario, prima ancora che la partenza sia scelta.
  // MapView osserva "properties" per ricentrare la mappa (FitBounds) e con
  // un riferimento sempre nuovo la rifà a ogni click, con l'animazione di
  // Leaflet che blocca il resto del render: è per questo che il colore
  // della data selezionata nel calendario impiegava secondi a comparire.
  const dateFilteredProperties = useMemo(
    () =>
      datesSelected && availableIds ? properties.filter((p) => availableIds.has(p.id)) : properties,
    [properties, datesSelected, availableIds]
  );
  const displayedProperties = useMemo(
    () => dateFilteredProperties.filter((p) => matchesLocation(p, location) && matchesFilters(p, filters)),
    [dateFilteredProperties, location, filters]
  );
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoGradient}>casa</span>
          <span>vacanze</span>
        </div>

        <SearchBar
          properties={properties}
          location={location}
          onChangeLocation={setLocation}
          checkIn={checkIn}
          checkOut={checkOut}
          onChangeDates={(ci, co) => {
            setCheckIn(ci);
            setCheckOut(co);
          }}
          adults={filters.adults}
          children={filters.children}
          petsAllowed={petsAllowed}
          onChangeGuests={handleChangeGuests}
          onOpenFilters={() => setFilterPanelOpen(true)}
          activeFilterCount={activeFilterCount}
        />

        <FilterPanel
          open={filterPanelOpen}
          properties={properties}
          value={filters}
          onChange={setFilters}
          onClose={() => setFilterPanelOpen(false)}
        />

        <div className={styles.headerRight}>
          <a href="/admin" className={styles.rentLink}>
            Gestione case
          </a>
          <a href="#" className={styles.rentLink}>
            Affitta con noi
          </a>
          <button type="button" className={styles.menuBtn} aria-label="Menu">
            <MenuIcon size={22} />
          </button>
        </div>
      </header>

      <div className={styles.resultsBar}>
        <span className={styles.resultsCount}>
          {checking
            ? "Controllo disponibilità..."
            : `${displayedProperties.length.toLocaleString("it-IT")} offerte`}
        </span>
        <a href="#" className={styles.moreLink}>
          <strong>Scopri di più</strong> sul posizionamento delle offerte
        </a>
      </div>

      {dateError && <p className={`${styles.statusNote} ${styles.warn}`}>{dateError}</p>}
      {datesSelected && source !== "db" && !dateError && (
        <p className={`${styles.statusNote} ${styles.warn}`}>
          Filtro date non attivo in modalità demo: nessuna casa reale nel database.
        </p>
      )}

      <div className={styles.content}>
        {displayedProperties.length === 0 && !checking ? (
          <div className={styles.emptyState}>
            Nessuna casa corrisponde ai criteri selezionati. Prova a cambiare data, località o
            filtri.
          </div>
        ) : (
          <div className={styles.list}>
            {displayedProperties.map((p) => (
              <div
                key={p.id}
                onMouseEnter={() => setActiveId(p.id)}
                onMouseLeave={() => setActiveId(null)}
              >
                <PropertyCard
                  property={p}
                  checkIn={datesSelected ? checkIn : undefined}
                  checkOut={datesSelected ? checkOut : undefined}
                />
              </div>
            ))}
          </div>
        )}

        <div className={styles.mapCol}>
          <MapErrorBoundary>
            <MapPreview
              properties={displayedProperties}
              activeId={activeId}
              onSelect={setActiveId}
            />
          </MapErrorBoundary>
        </div>
      </div>
    </div>
  );
}
