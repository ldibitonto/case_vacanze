"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AddressAutocomplete.module.css";
import { PinIcon } from "./icons";

// Stesso suggeritore di indirizzi/città della barra di ricerca in home
// (stesso endpoint /api/geocode/suggest, Nominatim/OpenStreetMap), estratto
// come componente riusabile per ogni altro campo del sito dove si inserisce
// una città o un indirizzo: checkout prenotazione, profilo account, admin.
function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

type Suggestion = { label: string; sublabel: string; fullLabel?: string };

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  className?: string;
  required?: boolean;
  // "address" (default): cliccando un suggerimento inserisce l'indirizzo
  // completo (via, numero civico se presente, città...) — per campi
  // "Indirizzo". "city": inserisce solo il nome del comune — per campi
  // "Città", dove l'indirizzo completo sarebbe fuorviante.
  variant?: "address" | "city";
};

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  id,
  name,
  className,
  required,
  variant = "address",
}: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const query = normalize(value);
  const isSearching = query.length >= 2;

  useEffect(() => {
    if (!isSearching) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/geocode/suggest?q=${encodeURIComponent(value.trim())}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: { results?: Suggestion[] }) => setSuggestions(data.results ?? []))
        .catch((err) => {
          if (err.name !== "AbortError") setSuggestions([]);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [isSearching, value]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function commit(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <input
        id={id}
        name={name}
        required={required}
        className={className ?? styles.input}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && isSearching && (
        <div className={styles.dropdown}>
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <button
                key={`${s.label}-${i}`}
                type="button"
                className={styles.item}
                onClick={() => commit(variant === "address" ? s.fullLabel ?? s.label : s.label)}
              >
                <PinIcon size={14} />
                <span className={styles.itemText}>
                  {s.label}
                  {s.sublabel && <span className={styles.itemSub}>{s.sublabel}</span>}
                </span>
              </button>
            ))
          ) : loading ? (
            <p className={styles.status}>Ricerca in corso...</p>
          ) : (
            <p className={styles.status}>Nessun suggerimento</p>
          )}
        </div>
      )}
    </div>
  );
}
