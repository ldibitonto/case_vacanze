"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./SearchBar.module.css";
import { CalendarIcon, FilterIcon, GuestsIcon, PetsIcon, PinIcon } from "./icons";
import { DateRangePicker } from "./DateRangePicker";
import type { Property } from "@/data/mockProperties";

const NATION_OPTIONS = ["Italia"];

// Corrispondono alle chiavi di REGION_PROVINCE_CODES (src/data/regions.ts):
// sono le uniche regioni per cui il filtro della home sa riconoscere anche
// indirizzi che non le nominano per esteso, quindi restano le uniche
// suggerite come "regione" oltre alle città vere e proprie.
const POPULAR_DESTINATIONS = [
  "Toscana",
  "Trentino-Alto Adige",
  "Liguria",
  "Puglia",
  "Sicilia",
  "Sardegna",
];

const RECENT_SEARCHES_KEY = "cv_recent_locations";

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(value: string) {
  if (typeof window === "undefined" || !value.trim()) return;
  const current = loadRecentSearches().filter((v) => v.toLowerCase() !== value.toLowerCase());
  const next = [value, ...current].slice(0, 5);
  window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

// Confronto tollerante agli accenti (es. "citta" trova "Città") e al
// maiuscolo/minuscolo.
function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type Props = {
  properties?: Property[];
  location: string;
  onChangeLocation: (value: string) => void;
  checkIn: string;
  checkOut: string;
  onChangeDates: (checkIn: string, checkOut: string) => void;
  adults: number;
  children: number;
  petsAllowed: boolean;
  onChangeGuests: (next: { adults: number; children: number; petsAllowed: boolean }) => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
};

type PopupId = "location" | "dates" | "guests" | null;

export function SearchBar({
  properties = [],
  location,
  onChangeLocation,
  checkIn,
  checkOut,
  onChangeDates,
  adults,
  children,
  petsAllowed,
  onChangeGuests,
  onOpenFilters,
  activeFilterCount = 0,
}: Props) {
  const [openPopup, setOpenPopup] = useState<PopupId>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Città (dagli indirizzi delle case vere) + regioni note + nazione: tutte
  // le opzioni tra cui filtrare mentre l'utente digita.
  const cityOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of properties) {
      const label = p.location?.trim();
      if (!label) continue;
      const key = normalize(label);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(label);
    }
    return out;
  }, [properties]);

  const allLocationOptions = useMemo(
    () => [...NATION_OPTIONS, ...POPULAR_DESTINATIONS, ...cityOptions],
    [cityOptions]
  );

  const query = normalize(location);
  const isSearching = query !== "" && query !== "italia";
  const filteredSuggestions = useMemo(() => {
    if (!isSearching) return [];
    return allLocationOptions.filter((v) => normalize(v).includes(query)).slice(0, 8);
  }, [allLocationOptions, isSearching, query]);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  useEffect(() => {
    if (!openPopup) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenPopup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openPopup]);

  function commitLocation(value: string) {
    onChangeLocation(value);
    saveRecentSearch(value);
    setRecentSearches(loadRecentSearches());
    setOpenPopup(null);
  }

  const guestsSummary =
    adults + children === 0
      ? "Ospiti"
      : `${adults + children} ${adults + children === 1 ? "ospite" : "ospiti"}`;

  const datesSummary =
    checkIn && checkOut
      ? `${new Date(checkIn).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })} - ${new Date(
          checkOut
        ).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}`
      : "";

  return (
    <div className={styles.bar} ref={wrapperRef}>
      <div className={styles.fieldWrap}>
        <div
          className={`${styles.field} ${styles.location} ${
            openPopup === "location" ? styles.fieldActive : ""
          }`}
        >
          <PinIcon size={16} />
          <input
            value={location}
            onFocus={() => setOpenPopup("location")}
            onChange={(e) => onChangeLocation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitLocation(location);
            }}
            placeholder="Dove vuoi andare?"
          />
          {location && (
            <button
              type="button"
              className={styles.clearBtn}
              aria-label="Cancella"
              onClick={() => onChangeLocation("")}
            >
              ✕
            </button>
          )}
        </div>

        {openPopup === "location" && (
          <div className={styles.popupCard}>
            {isSearching ? (
              filteredSuggestions.length > 0 ? (
                <>
                  <p className={styles.popupSectionTitle}>Suggerimenti</p>
                  <div className={styles.suggestionList}>
                    {filteredSuggestions.map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={styles.suggestionItem}
                        onClick={() => commitLocation(v)}
                      >
                        <PinIcon size={15} />
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className={styles.popupSectionTitle}>Nessun suggerimento per &quot;{location}&quot;</p>
              )
            ) : (
              <>
                {recentSearches.length > 0 && (
                  <>
                    <p className={styles.popupSectionTitle}>Ricerche recenti</p>
                    <div className={styles.suggestionList}>
                      {recentSearches.map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={styles.suggestionItem}
                          onClick={() => commitLocation(v)}
                        >
                          <PinIcon size={15} />
                          {v}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                <p className={styles.popupSectionTitle}>Destinazioni popolari</p>
                <div className={styles.suggestionList}>
                  {POPULAR_DESTINATIONS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={styles.suggestionItem}
                      onClick={() => commitLocation(v)}
                    >
                      <PinIcon size={15} />
                      {v}
                      <span className={styles.suggestionSub}>Italia</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.fieldWrap}>
        {datesSummary === "" && openPopup !== "dates" ? (
          <div
            className={`${styles.field} ${styles.dates}`}
            onClick={() => setOpenPopup("dates")}
          >
            <CalendarIcon size={16} />
            <span className={styles.datesPlaceholder}>Scegli le date</span>
          </div>
        ) : (
          <div className={styles.dateFieldsRow}>
            <div
              className={`${styles.field} ${styles.dateHalf} ${
                openPopup === "dates" ? styles.fieldActive : ""
              }`}
              onClick={() => setOpenPopup("dates")}
            >
              <CalendarIcon size={16} />
              <div className={styles.dateHalfText}>
                <span className={styles.dateHalfLabel}>Arrivo</span>
                <span>{checkIn ? new Date(checkIn).toLocaleDateString("it-IT") : "Aggiungi data"}</span>
              </div>
            </div>
            <div
              className={`${styles.field} ${styles.dateHalf} ${
                openPopup === "dates" ? styles.fieldActive : ""
              }`}
              onClick={() => setOpenPopup("dates")}
            >
              <CalendarIcon size={16} />
              <div className={styles.dateHalfText}>
                <span className={styles.dateHalfLabel}>Partenza</span>
                <span>{checkOut ? new Date(checkOut).toLocaleDateString("it-IT") : "Aggiungi data"}</span>
              </div>
            </div>
          </div>
        )}

        {openPopup === "dates" && (
          <div className={`${styles.popupCard} ${styles.popupCardWide}`}>
            <DateRangePicker
              checkIn={checkIn}
              checkOut={checkOut}
              onChange={onChangeDates}
              onClose={() => setOpenPopup(null)}
            />
          </div>
        )}
      </div>

      <div className={styles.fieldWrap}>
        <div
          className={`${styles.field} ${styles.guests} ${
            openPopup === "guests" ? styles.fieldActive : ""
          }`}
          onClick={() => setOpenPopup("guests")}
        >
          <GuestsIcon size={16} />
          <span>{guestsSummary}</span>
        </div>

        {openPopup === "guests" && (
          <div className={styles.popupCard}>
            <div className={styles.guestRow}>
              <div>
                <p className={styles.guestLabel}>Adulti</p>
                <p className={styles.guestSublabel}>18 anni e oltre</p>
              </div>
              <div className={styles.stepperControls}>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  disabled={adults <= 0}
                  onClick={() => onChangeGuests({ adults: Math.max(0, adults - 1), children, petsAllowed })}
                >
                  −
                </button>
                <span className={styles.stepperValue}>{adults}</span>
                <button
                  type="button"
                  className={styles.stepperBtn}
                  onClick={() => onChangeGuests({ adults: adults + 1, children, petsAllowed })}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.guestRow}>
              <div>
                <p className={styles.guestLabel}>Bambini</p>
                <p className={styles.guestSublabel}>0-17 anni</p>
              </div>
              {children === 0 ? (
                <button
                  type="button"
                  className={styles.addBtn}
                  onClick={() => onChangeGuests({ adults, children: 1, petsAllowed })}
                >
                  Aggiungi
                </button>
              ) : (
                <div className={styles.stepperControls}>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() =>
                      onChangeGuests({ adults, children: Math.max(0, children - 1), petsAllowed })
                    }
                  >
                    −
                  </button>
                  <span className={styles.stepperValue}>{children}</span>
                  <button
                    type="button"
                    className={styles.stepperBtn}
                    onClick={() => onChangeGuests({ adults, children: children + 1, petsAllowed })}
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            <div className={styles.guestRow}>
              <div className={styles.guestLabelRow}>
                <PetsIcon size={16} />
                <p className={styles.guestLabel}>Animali domestici ammessi</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={petsAllowed}
                className={`${styles.toggle} ${petsAllowed ? styles.toggleOn : ""}`}
                onClick={() => onChangeGuests({ adults, children, petsAllowed: !petsAllowed })}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            <div className={styles.popupFooter}>
              <button
                type="button"
                className={styles.clearLinkBtn}
                onClick={() => onChangeGuests({ adults: 0, children: 0, petsAllowed: false })}
              >
                Reimposta
              </button>
              <button type="button" className={styles.closeBtn} onClick={() => setOpenPopup(null)}>
                Chiudi
              </button>
            </div>
          </div>
        )}
      </div>

      <button type="button" className={styles.filterBtn} onClick={onOpenFilters}>
        <FilterIcon size={16} />
        Filtro
        {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
      </button>
    </div>
  );
}
