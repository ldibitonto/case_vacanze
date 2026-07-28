"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { AddressAutocomplete } from "@/components/home/AddressAutocomplete";
import { BriefcaseIcon, UserCircleIcon } from "@/components/home/icons";

// Pagina "Il tuo account": profilo (dati personali) + prenotazioni
// dell'ospite loggato via magic link. Nessuna password: l'identità è il
// cookie di sessione httpOnly, verificato lato server dalle API
// /api/account/*; se non c'è sessione valida rimandiamo semplicemente alla
// home con l'invito ad accedere dal menu in alto.

type Profile = {
  email: string;
  name: string;
  surname: string;
  phone: string;
  address: string;
};

type Booking = {
  id: string;
  status: string;
  checkIn: string;
  checkOut: string;
  guestsCount: number;
  totalPrice: string;
  currency: string;
  propertyName: string;
  propertySlug: string;
  propertyImage: string;
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confermata",
  PENDING: "In attesa",
  CANCELLED: "Annullata",
  COMPLETED: "Completata",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

function AccountPageInner() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "prenotazioni" ? "prenotazioni" : "profilo";

  const [tab, setTab] = useState<"profilo" | "prenotazioni">(initialTab);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/account/profile")
      .then((res) => {
        if (res.status === 401) {
          setAuthed(false);
          return null;
        }
        setAuthed(true);
        return res.json();
      })
      .then((data: Profile | null) => {
        if (data) setProfile(data);
      })
      .catch(() => setAuthed(false))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab !== "prenotazioni" || !authed || bookings) return;
    setBookingsLoading(true);
    fetch("/api/account/bookings")
      .then((res) => res.json())
      .then((data: Booking[]) => setBookings(data))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [tab, authed, bookings]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          surname: profile.surname,
          phone: profile.phone,
          address: profile.address,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.page}>Caricamento...</div>;
  }

  if (!authed || !profile) {
    return (
      <div className={styles.page}>
        <div className={styles.notAuthed}>
          <h1>Il tuo account</h1>
          <p>Devi accedere come guest per vedere questa pagina.</p>
          <Link href="/" className={styles.backLink}>
            Torna alla home e accedi dal menu in alto a destra
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/" className={styles.backLink}>
          ← Torna alla home
        </Link>

        <h1 className={styles.title}>Il tuo account</h1>
        <p className={styles.subtitle}>{profile.email}</p>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "profilo" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("profilo")}
          >
            <UserCircleIcon size={17} />
            Il tuo account
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${tab === "prenotazioni" ? styles.tabBtnActive : ""}`}
            onClick={() => setTab("prenotazioni")}
          >
            <BriefcaseIcon size={17} />
            Le tue prenotazioni
          </button>
        </div>

        {tab === "profilo" ? (
          <form className={styles.formCard} onSubmit={handleSaveProfile}>
            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label htmlFor="name">Nome</label>
                <input
                  id="name"
                  className={styles.input}
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label htmlFor="surname">Cognome</label>
                <input
                  id="surname"
                  className={styles.input}
                  value={profile.surname}
                  onChange={(e) => setProfile({ ...profile, surname: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="phone">Telefono</label>
              <input
                id="phone"
                type="tel"
                className={styles.input}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="address">Indirizzo</label>
              <AddressAutocomplete
                id="address"
                className={styles.input}
                value={profile.address}
                onChange={(v) => setProfile({ ...profile, address: v })}
                placeholder="Via, città, provincia"
              />
            </div>

            <div className={styles.formFooter}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? "Salvataggio..." : "Salva modifiche"}
              </button>
              {saveStatus === "saved" && <span className={styles.savedText}>Salvato ✓</span>}
              {saveStatus === "error" && (
                <span className={styles.errorText}>Errore nel salvataggio, riprova.</span>
              )}
            </div>
          </form>
        ) : (
          <div className={styles.bookingsList}>
            {bookingsLoading ? (
              <p className={styles.emptyText}>Caricamento prenotazioni...</p>
            ) : !bookings || bookings.length === 0 ? (
              <p className={styles.emptyText}>Non hai ancora nessuna prenotazione.</p>
            ) : (
              bookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/property/${b.propertySlug}`}
                  className={styles.bookingCard}
                >
                  <img src={b.propertyImage} alt={b.propertyName} className={styles.bookingImage} />
                  <div className={styles.bookingInfo}>
                    <p className={styles.bookingName}>{b.propertyName}</p>
                    <p className={styles.bookingDates}>
                      {formatDate(b.checkIn)} — {formatDate(b.checkOut)} · {b.guestsCount} ospiti
                    </p>
                    <p className={styles.bookingStatus}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </p>
                  </div>
                  <div className={styles.bookingPrice}>
                    {b.totalPrice} {b.currency}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className={styles.page}>Caricamento...</div>}>
      <AccountPageInner />
    </Suspense>
  );
}
