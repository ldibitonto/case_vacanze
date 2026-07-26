"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";

// Sostituisce la pagina di pagamento reale (es. Stripe Checkout) finché
// non hai un account/chiavi di test valide. Mostra un riepilogo dell'ordine
// e un form di pagamento "classico" (numero carta, scadenza, CVV): nessun
// dato viene verificato con un vero circuito, è solo una simulazione visiva.
// Al submit: stato "processing" (spinner) -> POST /api/bookings/confirm
// -> stato "done" (pagamento completato) o "error".

type Status = "idle" | "processing" | "done" | "error";

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <MockCheckoutContent />
    </Suspense>
  );
}

function MockCheckoutContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") ?? "";
  const amount = Number(searchParams.get("amount") ?? 0) / 100;
  const currency = searchParams.get("currency") ?? "EUR";
  const description = searchParams.get("description") ?? "Prenotazione casa vacanza";
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<Status>("idle");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!cardName.trim()) next.cardName = "Inserisci il nome sulla carta.";
    if (cardNumber.replace(/\s/g, "").length !== 16) {
      next.cardNumber = "Il numero carta deve avere 16 cifre.";
    }
    const [mm, yy] = expiry.split("/");
    if (!mm || !yy || yy.length !== 2 || Number(mm) < 1 || Number(mm) > 12) {
      next.expiry = "Scadenza non valida (MM/AA).";
    }
    if (cvv.length < 3) next.cvv = "CVV non valido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("processing");

    // Piccolo ritardo finto per dare la sensazione di un pagamento in corso,
    // poi confermiamo davvero la prenotazione lato server.
    await new Promise((resolve) => setTimeout(resolve, 1600));

    try {
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className={styles.page}>
      <a href="/" className={styles.backLink}>
        ← Torna alla ricerca
      </a>

      <div className={styles.card}>
        <div className={styles.summary}>
          <div>
            <div className={styles.summaryEyebrow}>Riepilogo prenotazione</div>
            <p className={styles.summaryTitle}>{description}</p>
          </div>

          {email && (
            <div className={styles.summaryRow}>
              <span>Email</span>
              <span>{email}</span>
            </div>
          )}
          <div className={styles.summaryRow}>
            <span>Numero prenotazione</span>
            <span>{bookingId.slice(0, 10) || "—"}</span>
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Totale da pagare</span>
            <span className={styles.totalAmount}>
              {amount.toFixed(2)} {currency}
            </span>
          </div>

          <div className={styles.secureNote}>
            <LockIcon />
            Pagamento simulato — nessun dato reale viene trasmesso.
          </div>
        </div>

        {status === "idle" && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div>
              <h1 className={styles.formTitle}>Dati di pagamento</h1>
              <p className={styles.formSubtitle}>
                Inserisci i dati della carta per completare l&apos;acquisto.
              </p>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="cardName">
                Nome sulla carta
              </label>
              <input
                id="cardName"
                className={`${styles.input} ${errors.cardName ? styles.inputError : ""}`}
                placeholder="Mario Rossi"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
              {errors.cardName && <span className={styles.errorText}>{errors.cardName}</span>}
            </div>

            <div className={`${styles.fieldGroup} ${styles.cardBrandRow}`}>
              <label className={styles.label} htmlFor="cardNumber">
                Numero carta
              </label>
              <input
                id="cardNumber"
                className={`${styles.input} ${errors.cardNumber ? styles.inputError : ""}`}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              />
              <CardIcon />
              {errors.cardNumber && <span className={styles.errorText}>{errors.cardNumber}</span>}
            </div>

            <div className={styles.row2}>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="expiry">
                  Scadenza (MM/AA)
                </label>
                <input
                  id="expiry"
                  className={`${styles.input} ${errors.expiry ? styles.inputError : ""}`}
                  placeholder="12/28"
                  inputMode="numeric"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                />
                {errors.expiry && <span className={styles.errorText}>{errors.expiry}</span>}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="cvv">
                  CVV
                </label>
                <input
                  id="cvv"
                  className={`${styles.input} ${errors.cvv ? styles.inputError : ""}`}
                  placeholder="123"
                  inputMode="numeric"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
                {errors.cvv && <span className={styles.errorText}>{errors.cvv}</span>}
              </div>
            </div>

            <button type="submit" className={styles.payBtn}>
              Paga {amount.toFixed(2)} {currency}
            </button>
            <p className={styles.mockNote}>
              Demo: qualsiasi numero di carta con il formato corretto viene accettato.
            </p>
          </form>
        )}

        {status === "processing" && (
          <div className={styles.statusScreen}>
            <div className={styles.spinner} />
            <h2 className={styles.statusHeading}>Elaborazione del pagamento...</h2>
            <p className={styles.statusSubtext}>Non chiudere questa pagina, ci vorranno pochi secondi.</p>
          </div>
        )}

        {status === "done" && (
          <div className={styles.statusScreen}>
            <div className={styles.successIcon}>
              <CheckCircleIcon />
            </div>
            <h2 className={styles.statusHeading}>Pagamento completato!</h2>
            <p className={styles.statusSubtext}>
              La tua prenotazione è confermata. Riceverai una conferma via email a breve.
            </p>
            <a href="/" className={styles.homeBtn}>
              Torna alla home
            </a>
          </div>
        )}

        {status === "error" && (
          <div className={styles.statusScreen}>
            <div className={styles.errorIcon}>
              <ErrorIcon />
            </div>
            <h2 className={styles.statusHeading}>Pagamento non riuscito</h2>
            <p className={styles.statusSubtext}>Si è verificato un problema. Riprova.</p>
            <button type="button" className={styles.homeBtn} onClick={() => setStatus("idle")}>
              Riprova
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
