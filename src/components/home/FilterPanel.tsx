"use client";

import { useMemo } from "react";
import styles from "./FilterPanel.module.css";
import { amenityIcon, PetsIcon, PoolIcon, KitchenIcon, AcIcon } from "./icons";
import { amenityGroups } from "@/data/amenities";
import type { Property, Amenity } from "@/data/mockProperties";

// Pannello filtri della home: filtri rapidi (chip), range di prezzo,
// composizione ospiti/camere/bagni e checklist servizi (dal catalogo
// condiviso con /admin/properties). Applica un filtro "AND": una casa deve
// avere TUTTE le caratteristiche selezionate per comparire nei risultati.

export type FiltersState = {
  priceMin: number | null;
  priceMax: number | null;
  adults: number;
  children: number;
  bedroomsMin: number;
  bathroomsMin: number;
  amenities: Amenity[];
};

export const EMPTY_FILTERS: FiltersState = {
  priceMin: null,
  priceMax: null,
  adults: 0,
  children: 0,
  bedroomsMin: 0,
  bathroomsMin: 0,
  amenities: [],
};

export function countActiveFilters(f: FiltersState): number {
  let n = 0;
  if (f.priceMin !== null) n++;
  if (f.priceMax !== null) n++;
  if (f.adults > 0 || f.children > 0) n++;
  if (f.bedroomsMin > 0) n++;
  if (f.bathroomsMin > 0) n++;
  n += f.amenities.length;
  return n;
}

export function matchesFilters(p: Property, f: FiltersState): boolean {
  if (f.priceMin !== null && p.pricePerNight < f.priceMin) return false;
  if (f.priceMax !== null && p.pricePerNight > f.priceMax) return false;

  const requiredGuests = f.adults + f.children;
  if (requiredGuests > 0 && p.guests < requiredGuests) return false;

  if (f.bedroomsMin > 0 && p.bedrooms < f.bedroomsMin) return false;
  if (f.bathroomsMin > 0 && p.bathrooms < f.bathroomsMin) return false;

  for (const a of f.amenities) {
    if (!p.amenities.includes(a)) return false;
  }

  return true;
}

const QUICK_FILTERS: { value: Amenity; label: string; Icon: typeof PoolIcon }[] = [
  { value: "pets", label: "Animali ammessi", Icon: PetsIcon },
  { value: "pool", label: "Piscina", Icon: PoolIcon },
  { value: "kitchen", label: "Cucina", Icon: KitchenIcon },
  { value: "ac", label: "Aria condizionata", Icon: AcIcon },
];

function Stepper({
  label,
  sublabel,
  value,
  min = 0,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: number;
  min?: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className={styles.stepperRow}>
      <div>
        <p className={styles.stepperLabel}>{label}</p>
        {sublabel && <p className={styles.stepperSublabel}>{sublabel}</p>}
      </div>
      <div className={styles.stepperControls}>
        <button
          type="button"
          className={styles.stepperBtn}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Diminuisci ${label}`}
        >
          −
        </button>
        <span className={styles.stepperValue}>{value}</span>
        <button
          type="button"
          className={styles.stepperBtn}
          onClick={() => onChange(value + 1)}
          aria-label={`Aumenta ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function FilterPanel({
  open,
  properties,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  properties: Property[];
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  onClose: () => void;
}) {
  const priceBounds = useMemo(() => {
    if (properties.length === 0) return { min: 0, max: 1000 };
    const prices = properties.map((p) => p.pricePerNight);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [properties]);

  if (!open) return null;

  function toggleAmenity(a: Amenity) {
    onChange({
      ...value,
      amenities: value.amenities.includes(a)
        ? value.amenities.filter((x) => x !== a)
        : [...value.amenities, a],
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Filtro</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Chiudi">
            ×
          </button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Filtri rapidi</h3>
            <div className={styles.quickGrid}>
              {QUICK_FILTERS.map(({ value: v, label, Icon }) => (
                <button
                  key={v}
                  type="button"
                  className={`${styles.quickChip} ${
                    value.amenities.includes(v) ? styles.quickChipActive : ""
                  }`}
                  onClick={() => toggleAmenity(v)}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Prezzo per notte</h3>
            <div className={styles.priceRow}>
              <div className={styles.fieldGroup}>
                <label>Min</label>
                <input
                  type="number"
                  className={styles.priceInput}
                  placeholder={`${priceBounds.min}`}
                  value={value.priceMin ?? ""}
                  min={0}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      priceMin: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
              <span className={styles.priceSeparator}>—</span>
              <div className={styles.fieldGroup}>
                <label>Max</label>
                <input
                  type="number"
                  className={styles.priceInput}
                  placeholder={`${priceBounds.max}`}
                  value={value.priceMax ?? ""}
                  min={0}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      priceMax: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
              <span className={styles.priceHint}>
                {priceBounds.min} € - {priceBounds.max} €+
              </span>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Ospiti e camere</h3>
            <Stepper
              label="Adulti"
              sublabel="18 anni e oltre"
              value={value.adults}
              onChange={(n) => onChange({ ...value, adults: n })}
            />
            <Stepper
              label="Bambini"
              sublabel="0-17 anni"
              value={value.children}
              onChange={(n) => onChange({ ...value, children: n })}
            />
            <Stepper
              label="Camere da letto"
              value={value.bedroomsMin}
              onChange={(n) => onChange({ ...value, bedroomsMin: n })}
            />
            <Stepper
              label="Bagni"
              value={value.bathroomsMin}
              onChange={(n) => onChange({ ...value, bathroomsMin: n })}
            />
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Servizi</h3>
            {amenityGroups().map((group) => (
              <div key={group.id} className={styles.amenityGroup}>
                <p className={styles.amenityGroupTitle}>{group.label}</p>
                <div className={styles.amenitiesGrid}>
                  {group.items.map((item) => {
                    const Icon = amenityIcon[item.value];
                    return (
                      <label
                        key={item.value}
                        className={`${styles.amenityChip} ${
                          value.amenities.includes(item.value) ? styles.amenityChipActive : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={value.amenities.includes(item.value)}
                          onChange={() => toggleAmenity(item.value)}
                        />
                        {Icon ? <Icon size={16} /> : null}
                        {item.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={() => onChange(EMPTY_FILTERS)}
          >
            Reimposta
          </button>
          <button type="button" className={styles.applyBtn} onClick={onClose}>
            Mostra risultati
          </button>
        </div>
      </div>
    </div>
  );
}
