"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import type { Amenity } from "@/data/mockProperties";
import { amenityGroups } from "@/data/amenities";
import { amenityIcon } from "@/components/home/icons";
import { AddressAutocomplete } from "@/components/home/AddressAutocomplete";

// Pannello per creare/modificare le case vacanza e caricarne le foto, senza
// dover toccare codice o Prisma Studio. Nessuna autenticazione: come /admin,
// va bene per uso locale/dev.

type AdminProperty = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  maxGuests: number;
  basePrice: string | number;
  currency: string;
  image: string | null;
  images: string[];
  amenities: string[];
  rating: number;
  reviews: number;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
  promotedBy: string | null;
  cancellationPolicy: string;
};

type FormState = {
  name: string;
  description: string;
  address: string;
  maxGuests: number;
  basePrice: number;
  currency: string;
  image: string;
  images: string[];
  amenities: Amenity[];
  rating: number;
  reviews: number;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
  promotedBy: string;
  cancellationPolicy: string;
};

const DEFAULT_CANCELLATION_POLICY =
  "Cancellazione gratuita fino a 7 giorni prima dell'arrivo. Dopo questa data, la prima notte non è rimborsabile.";

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  address: "",
  maxGuests: 4,
  basePrice: 80,
  currency: "EUR",
  image: "",
  images: [],
  amenities: [],
  rating: 4.8,
  reviews: 0,
  sqm: 60,
  bedrooms: 1,
  bathrooms: 1,
  promotedBy: "",
  cancellationPolicy: DEFAULT_CANCELLATION_POLICY,
};

const AMENITY_GROUPS = amenityGroups();

type Notice = { type: "ok" | "error"; text: string } | null;

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  function refresh() {
    setLoading(true);
    fetch("/api/admin/properties")
      .then((res) => res.json())
      .then((data: AdminProperty[]) => setProperties(data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
  }, []);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setNotice(null);
    setMode("create");
  }

  function startEdit(p: AdminProperty) {
    setForm({
      name: p.name,
      description: p.description ?? "",
      address: p.address ?? "",
      maxGuests: p.maxGuests,
      basePrice: Number(p.basePrice),
      currency: p.currency,
      image: p.image ?? "",
      images: p.images ?? [],
      amenities: (p.amenities as Amenity[]) ?? [],
      rating: p.rating,
      reviews: p.reviews,
      sqm: p.sqm,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      promotedBy: p.promotedBy ?? "",
      cancellationPolicy: p.cancellationPolicy || DEFAULT_CANCELLATION_POLICY,
    });
    setEditingId(p.id);
    setNotice(null);
    setMode("edit");
  }

  function toggleAmenity(value: Amenity) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(value)
        ? f.amenities.filter((a) => a !== value)
        : [...f.amenities, value],
    }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Errore nel caricamento immagine." });
        return;
      }
      setForm((f) => ({ ...f, image: data.url }));
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setNotice(null);
    try {
      // Caricamento in sequenza: più semplice da seguire e da gestire in
      // caso di errore su un singolo file rispetto a un Promise.all.
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setNotice({ type: "error", text: data.error ?? "Errore nel caricamento di una foto." });
          continue;
        }
        setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeGalleryImage(url: string) {
    setForm((f) => ({ ...f, images: f.images.filter((img) => img !== url) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setNotice({ type: "error", text: "Il nome è obbligatorio." });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    const payload = {
      name: form.name,
      description: form.description || undefined,
      address: form.address || undefined,
      maxGuests: Number(form.maxGuests),
      basePrice: Number(form.basePrice),
      currency: form.currency,
      image: form.image || undefined,
      images: form.images,
      amenities: form.amenities,
      rating: Number(form.rating),
      reviews: Number(form.reviews),
      sqm: Number(form.sqm),
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      promotedBy: form.promotedBy || undefined,
      cancellationPolicy: form.cancellationPolicy || DEFAULT_CANCELLATION_POLICY,
    };

    try {
      const isEdit = mode === "edit" && editingId;
      const res = await fetch(
        isEdit ? `/api/admin/properties/${editingId}` : "/api/admin/properties",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Errore nel salvataggio." });
        return;
      }

      setNotice({ type: "ok", text: isEdit ? "Casa aggiornata." : "Casa creata." });
      setMode("list");
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(p: AdminProperty) {
    if (!confirm(`Eliminare "${p.name}"? L'operazione non è reversibile.`)) return;

    setNotice(null);
    const res = await fetch(`/api/admin/properties/${p.id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      setNotice({ type: "error", text: data.error ?? "Errore nell'eliminazione." });
      return;
    }

    setNotice({ type: "ok", text: "Casa eliminata." });
    refresh();
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestione case e foto</h1>
        <div className={styles.navLinks}>
          <a href="/admin" className={styles.backLink}>
            Disponibilità →
          </a>
          <a href="/" className={styles.backLink}>
            ← Torna al sito
          </a>
        </div>
      </div>

      <div className={styles.container}>
        {notice && (
          <div
            className={`${styles.notice} ${notice.type === "error" ? styles.noticeError : styles.noticeOk}`}
          >
            {notice.text}
          </div>
        )}

        {mode === "list" && (
          <>
            <div className={styles.topBar}>
              <span />
              <button type="button" className={styles.primaryBtn} onClick={startCreate}>
                + Nuova casa
              </button>
            </div>

            {loading && <p className={styles.emptyText}>Caricamento...</p>}
            {!loading && properties.length === 0 && (
              <p className={styles.emptyText}>Nessuna casa ancora. Creane una con "+ Nuova casa".</p>
            )}

            <div className={styles.list}>
              {properties.map((p) => (
                <div key={p.id} className={styles.card}>
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt={p.name} className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbPlaceholder}>Nessuna foto</div>
                  )}
                  <div className={styles.cardInfo}>
                    <p className={styles.cardTitle}>{p.name}</p>
                    <p className={styles.cardMeta}>
                      {p.address || "Indirizzo non impostato"} · {p.maxGuests} ospiti ·{" "}
                      {Number(p.basePrice).toFixed(2)} {p.currency}/notte
                    </p>
                  </div>
                  <div className={styles.cardActions}>
                    <button type="button" className={styles.secondaryBtn} onClick={() => startEdit(p)}>
                      Modifica
                    </button>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => handleDelete(p)}
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(mode === "create" || mode === "edit") && (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>
              {mode === "edit" ? "Modifica casa" : "Nuova casa"}
            </h2>

            <div className={styles.fieldGroup}>
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                className={styles.input}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Es. Casa con piscina in Sicilia"
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="description">Descrizione</label>
              <textarea
                id="description"
                className={styles.textarea}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="address">Indirizzo</label>
              <AddressAutocomplete
                id="address"
                className={styles.input}
                value={form.address}
                onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                placeholder="Via, città, provincia — usato anche per la posizione in mappa"
              />
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label htmlFor="maxGuests">Ospiti max</label>
                <input
                  id="maxGuests"
                  type="number"
                  min={1}
                  className={styles.input}
                  value={form.maxGuests}
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: Number(e.target.value) || 1 }))}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="sqm">Superficie (m²)</label>
                <input
                  id="sqm"
                  type="number"
                  min={1}
                  className={styles.input}
                  value={form.sqm}
                  onChange={(e) => setForm((f) => ({ ...f, sqm: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label htmlFor="bedrooms">Camere da letto</label>
                <input
                  id="bedrooms"
                  type="number"
                  min={1}
                  className={styles.input}
                  value={form.bedrooms}
                  onChange={(e) => setForm((f) => ({ ...f, bedrooms: Number(e.target.value) || 1 }))}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="bathrooms">Bagni</label>
                <input
                  id="bathrooms"
                  type="number"
                  min={1}
                  className={styles.input}
                  value={form.bathrooms}
                  onChange={(e) => setForm((f) => ({ ...f, bathrooms: Number(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label htmlFor="basePrice">Prezzo per notte</label>
                <input
                  id="basePrice"
                  type="number"
                  min={0}
                  step="0.01"
                  className={styles.input}
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="currency">Valuta</label>
                <select
                  id="currency"
                  className={styles.select}
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label>Foto principale</label>
              <div className={styles.imageUploadRow}>
                {form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.image} alt="Anteprima" className={styles.imagePreview} />
                ) : (
                  <div className={styles.imagePreviewEmpty}>Nessuna foto</div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
              </div>
              {uploading && <span className={styles.cardMeta}>Caricamento in corso...</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label>Galleria foto (mostrata nella pagina dettaglio casa)</label>
              {form.images.length > 0 && (
                <div className={styles.galleryGrid}>
                  {form.images.map((url) => (
                    <div key={url} className={styles.galleryThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Foto galleria" />
                      <button
                        type="button"
                        className={styles.galleryRemoveBtn}
                        onClick={() => removeGalleryImage(url)}
                        aria-label="Rimuovi foto"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                disabled={uploading}
              />
              {uploading && <span className={styles.cardMeta}>Caricamento in corso...</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="cancellationPolicy">Politica di cancellazione</label>
              <textarea
                id="cancellationPolicy"
                className={styles.textarea}
                value={form.cancellationPolicy}
                onChange={(e) => setForm((f) => ({ ...f, cancellationPolicy: e.target.value }))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label>Servizi offerti (mostrati con icona nella pagina dettaglio casa)</label>
              {AMENITY_GROUPS.map((group) => (
                <div key={group.id} className={styles.amenityGroup}>
                  <p className={styles.amenityGroupTitle}>{group.label}</p>
                  <div className={styles.amenitiesGrid}>
                    {group.items.map((opt) => {
                      const Icon = amenityIcon[opt.value];
                      return (
                        <label
                          key={opt.value}
                          className={`${styles.amenityChip} ${
                            form.amenities.includes(opt.value) ? styles.checked : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={form.amenities.includes(opt.value)}
                            onChange={() => toggleAmenity(opt.value)}
                          />
                          {Icon ? <Icon size={15} /> : null}
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label htmlFor="rating">Rating (0-5)</label>
                <input
                  id="rating"
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  className={styles.input}
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="reviews">Numero recensioni</label>
                <input
                  id="reviews"
                  type="number"
                  min={0}
                  className={styles.input}
                  value={form.reviews}
                  onChange={(e) => setForm((f) => ({ ...f, reviews: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="promotedBy">Promosso da (opzionale)</label>
              <input
                id="promotedBy"
                className={styles.input}
                value={form.promotedBy}
                onChange={(e) => setForm((f) => ({ ...f, promotedBy: e.target.value }))}
                placeholder="Es. Booking.com"
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setMode("list")}
              >
                Annulla
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={submitting || uploading}>
                {submitting ? "Salvataggio..." : mode === "edit" ? "Salva modifiche" : "Crea casa"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
