"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

// Pannello interno per bloccare/sbloccare manualmente le date di una casa
// (manutenzione, uso personale, ecc.) e per annullare prenotazioni reali.
// Nessuna autenticazione: pensato per uso locale/dev, non esporlo online
// senza aggiungere un controllo di accesso.

type PropertyLite = {
  id: string;
  name: string;
  slug: string;
  maxGuests: number;
  basePrice: string | number;
  currency: string;
};

type BlockedRange = { start: string; end: string };

type BookingItem = {
  id: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
};

type PastBookingItem = {
  id: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  reviewRequestedAt: string | null;
  hasReview: boolean;
  reviewRating: number | null;
};

type AvailabilityData = {
  property: PropertyLite;
  blockedRanges: BlockedRange[];
  bookings: BookingItem[];
  pastBookings: PastBookingItem[];
};

function formatRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  return `${fmt(start)} → ${fmt(end)}`;
}

export default function AdminPage() {
  const [properties, setProperties] = useState<PropertyLite[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [data, setData] = useState<AvailabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((list: PropertyLite[]) => {
        setProperties(list);
        if (list.length > 0) setSelectedId(list[0].id);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setNotice(null);
    fetch(`/api/admin/availability?propertyId=${selectedId}`)
      .then((res) => res.json())
      .then((d: AvailabilityData) => setData(d))
      .finally(() => setLoading(false));
  }, [selectedId]);

  function refresh() {
    if (!selectedId) return;
    setLoading(true);
    fetch(`/api/admin/availability?propertyId=${selectedId}`)
      .then((res) => res.json())
      .then((d: AvailabilityData) => setData(d))
      .finally(() => setLoading(false));
  }

  async function handleBlock() {
    if (!checkIn || !checkOut || !selectedId) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: selectedId, checkIn, checkOut }),
      });
      const body = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: body.error ?? "Errore nel blocco delle date." });
      } else {
        setNotice({ type: "ok", text: `Bloccati ${body.blockedDays} giorni.` });
        setCheckIn("");
        setCheckOut("");
        refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnblock(range: BlockedRange) {
    if (!selectedId) return;
    setNotice(null);
    const res = await fetch("/api/admin/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: selectedId, checkIn: range.start, checkOut: range.end }),
    });
    if (res.ok) {
      setNotice({ type: "ok", text: "Periodo sbloccato." });
      refresh();
    } else {
      setNotice({ type: "error", text: "Errore nello sblocco." });
    }
  }

  async function handleCancelBooking(bookingId: string) {
    setNotice(null);
    const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: "POST" });
    if (res.ok) {
      setNotice({ type: "ok", text: "Prenotazione annullata." });
      refresh();
    } else {
      setNotice({ type: "error", text: "Errore nell'annullamento." });
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/host-logout", { method: "POST" });
    window.location.href = "/";
  }

  const [requestingReviewId, setRequestingReviewId] = useState<string | null>(null);

  async function handleRequestReview(bookingId: string) {
    setNotice(null);
    setRequestingReviewId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/request-review`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setNotice({ type: "error", text: data.error ?? "Errore nell'invio della richiesta." });
        return;
      }
      setNotice({
        type: "ok",
        text: data.emailSent
          ? "Email di richiesta recensione inviata."
          : "Richiesta creata, ma l'email non è stata inviata (RESEND_API_KEY non configurata): copia il link dalla console del server.",
      });
      refresh();
    } finally {
      setRequestingReviewId(null);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestione disponibilità</h1>
        <div className={styles.navLinks}>
          <a href="/admin/properties" className={styles.backLink}>
            Case e foto →
          </a>
          <a href="/" className={styles.backLink}>
            ← Torna al sito
          </a>
          <button type="button" className={styles.backLink} onClick={handleLogout}>
            Esci
          </button>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.selectorCard}>
          <label className={styles.label} htmlFor="property">
            Casa
          </label>
          <select
            id="property"
            className={styles.select}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {data && (
            <p className={styles.propertyMeta}>
              {data.property.maxGuests} ospiti max · {Number(data.property.basePrice).toFixed(2)}{" "}
              {data.property.currency}/notte · slug: {data.property.slug}
            </p>
          )}
        </div>

        {notice && (
          <div className={`${styles.notice} ${notice.type === "error" ? styles.noticeError : styles.noticeOk}`}>
            {notice.text}
          </div>
        )}

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Blocca un periodo</h2>
          <div className={styles.form}>
            <div className={styles.fieldGroup}>
              <label htmlFor="blockCheckIn">Dal</label>
              <input
                id="blockCheckIn"
                type="date"
                className={styles.input}
                value={checkIn}
                max={checkOut || undefined}
                onChange={(e) => setCheckIn(e.target.value)}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="blockCheckOut">Al (escluso)</label>
              <input
                id="blockCheckOut"
                type="date"
                className={styles.input}
                value={checkOut}
                min={checkIn || undefined}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!checkIn || !checkOut || submitting}
              onClick={handleBlock}
            >
              {submitting ? "Blocco in corso..." : "Blocca queste date"}
            </button>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Periodi bloccati manualmente</h2>
          {loading && <p className={styles.emptyText}>Caricamento...</p>}
          {!loading && data && data.blockedRanges.length === 0 && (
            <p className={styles.emptyText}>Nessun blocco manuale per questa casa.</p>
          )}
          {!loading && data && data.blockedRanges.length > 0 && (
            <div className={styles.list}>
              {data.blockedRanges.map((r) => (
                <div key={`${r.start}-${r.end}`} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>{formatRange(r.start, r.end)}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => handleUnblock(r)}
                  >
                    Sblocca
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Prenotazioni attive</h2>
          {!loading && data && data.bookings.length === 0 && (
            <p className={styles.emptyText}>Nessuna prenotazione attiva per questa casa.</p>
          )}
          {!loading && data && data.bookings.length > 0 && (
            <div className={styles.list}>
              {data.bookings.map((b) => (
                <div key={b.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>
                      {b.guestName}
                      <span
                        className={`${styles.badge} ${
                          b.status === "CONFIRMED" ? styles.badgeConfirmed : styles.badgePending
                        }`}
                      >
                        {b.status === "CONFIRMED" ? "Confermata" : "In attesa"}
                      </span>
                    </span>
                    <span className={styles.rowSub}>
                      {formatRange(b.checkIn, b.checkOut)} · {b.guestEmail}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.dangerBtn}
                    onClick={() => handleCancelBooking(b.id)}
                  >
                    Annulla
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Soggiorni conclusi</h2>
          <p className={styles.cardHint}>
            Dopo aver verificato che il soggiorno sia finito, invia all&apos;ospite l&apos;email
            con il link per lasciare una recensione.
          </p>
          {!loading && data && data.pastBookings.length === 0 && (
            <p className={styles.emptyText}>Nessun soggiorno concluso per questa casa.</p>
          )}
          {!loading && data && data.pastBookings.length > 0 && (
            <div className={styles.list}>
              {data.pastBookings.map((b) => (
                <div key={b.id} className={styles.row}>
                  <div className={styles.rowMain}>
                    <span className={styles.rowTitle}>
                      {b.guestName}
                      {b.hasReview && (
                        <span className={`${styles.badge} ${styles.badgeConfirmed}`}>
                          Recensito {b.reviewRating ? `★ ${b.reviewRating}` : ""}
                        </span>
                      )}
                      {!b.hasReview && b.reviewRequestedAt && (
                        <span className={`${styles.badge} ${styles.badgePending}`}>
                          Richiesta inviata
                        </span>
                      )}
                    </span>
                    <span className={styles.rowSub}>
                      {formatRange(b.checkIn, b.checkOut)} · {b.guestEmail}
                    </span>
                  </div>
                  {!b.hasReview && (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      disabled={requestingReviewId === b.id}
                      onClick={() => handleRequestReview(b.id)}
                    >
                      {requestingReviewId === b.id
                        ? "Invio..."
                        : b.reviewRequestedAt
                          ? "Rinvia richiesta"
                          : "Invia richiesta recensione"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
