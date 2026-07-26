"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
import { StarIcon } from "@/components/home/icons";

// Pagina pubblica raggiunta dal link nell'email "Com'è andato il tuo
// soggiorno?": l'admin la genera solo dopo aver verificato che il soggiorno
// sia concluso (vedi /admin -> "Soggiorni conclusi"). Il token è a uso
// singolo: una volta inviata la recensione il link smette di funzionare.

type ReviewInfo = {
  alreadyReviewed: boolean;
  propertyName?: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
};

function CheckCircleIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

export default function ReviewPage() {
  const params = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<ReviewInfo | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [guestName, setGuestName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data: ReviewInfo = await res.json();
        setInfo(data);
        if (data.guestName) setGuestName(data.guestName);
      })
      .finally(() => setLoading(false));
  }, [params.token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Seleziona una valutazione da 1 a 5 stelle.");
      return;
    }
    if (!comment.trim()) {
      setError("Scrivi qualche riga sulla tua esperienza.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, guestName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore nell'invio della recensione.");
        return;
      }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {loading && <p className={styles.stateText}>Caricamento...</p>}

        {!loading && notFound && (
          <p className={styles.stateText}>
            Questo link non è valido o è scaduto. Se pensi sia un errore, contattaci direttamente.
          </p>
        )}

        {!loading && !notFound && info?.alreadyReviewed && (
          <>
            <div className={styles.successIcon}>
              <CheckCircleIcon />
            </div>
            <p className={styles.stateText}>
              Hai già inviato una recensione per questo soggiorno. Grazie ancora per averci scelto!
            </p>
          </>
        )}

        {!loading && !notFound && info && !info.alreadyReviewed && !submitted && (
          <>
            <p className={styles.eyebrow}>Com'è andato il tuo soggiorno?</p>
            <h1 className={styles.title}>{info.propertyName}</h1>
            <p className={styles.subtitle}>
              {info.checkIn && info.checkOut
                ? `${new Date(info.checkIn).toLocaleDateString("it-IT")} → ${new Date(
                    info.checkOut
                  ).toLocaleDateString("it-IT")}`
                : "Raccontaci la tua esperienza"}
            </p>

            <form onSubmit={handleSubmit}>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.starBtn} ${
                      n <= (hoverRating || rating) ? styles.starBtnActive : ""
                    }`}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(n)}
                    aria-label={`${n} stelle`}
                  >
                    <StarIcon size={32} />
                  </button>
                ))}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="guestName">
                  Il tuo nome
                </label>
                <input
                  id="guestName"
                  className={styles.input}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="comment">
                  La tua recensione
                </label>
                <textarea
                  id="comment"
                  className={styles.textarea}
                  placeholder="Racconta com'è andato il soggiorno..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                />
              </div>

              {error && <p className={styles.errorText}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? "Invio in corso..." : "Invia recensione"}
              </button>
            </form>
          </>
        )}

        {submitted && (
          <>
            <div className={styles.successIcon}>
              <CheckCircleIcon />
            </div>
            <p className={styles.stateText}>
              Grazie per la tua recensione! È stata pubblicata sulla pagina della casa.
            </p>
          </>
        )}

        <a href="/" className={styles.homeLink}>
          ← Torna al sito
        </a>
      </div>
    </main>
  );
}
