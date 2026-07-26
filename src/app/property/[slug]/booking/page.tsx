"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { StarIcon } from "@/components/home/icons";

// Step "Inizia la prenotazione": stepper (Dati personali / Metodo di
// pagamento / Fatto) + form dati personali + un breve recap della
// prenotazione a destra. Si arriva qui dalla pagina di dettaglio
// /property/[slug] dopo aver verificato la disponibilità: le date (e il
// numero di ospiti) arrivano come query string e vengono precompilate qui.

type PropertyDetail = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  maxGuests: number;
  basePrice: string | number;
  currency: string;
  image: string | null;
  rating: number;
  reviews: number;
  sqm: number;
  cancellationPolicy: string;
};

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="3" y="13" width="4" height="6" rx="1.5" />
      <rect x="17" y="13" width="4" height="6" rx="1.5" />
      <path d="M19 19v1a2 2 0 0 1-2 2h-3" />
    </svg>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={null}>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);

  const [title, setTitle] = useState<"Sig." | "Sig.ra">("Sig.");
  const [guestName, setGuestName] = useState("");
  const [guestSurname, setGuestSurname] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [street, setStreet] = useState("");
  const [zip, setZip] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Italia");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const initialGuests = Number(searchParams.get("guests"));
  const [guestsCount, setGuestsCount] = useState(
    Number.isFinite(initialGuests) && initialGuests > 0 ? initialGuests : 1
  );
  const [checkIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut] = useState(searchParams.get("checkOut") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((list: PropertyDetail[]) => {
        setProperty(list.find((p) => p.slug === params.slug) ?? null);
      })
      .finally(() => setLoadingProperty(false));
  }, [params.slug]);

  const nights = useMemo(
    () =>
      checkIn && checkOut
        ? Math.max(
            0,
            Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
          )
        : 0,
    [checkIn, checkOut]
  );
  const total = property ? nights * Number(property.basePrice) : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!property) {
      setError("Casa non trovata");
      return;
    }

    if (guestEmail !== confirmEmail) {
      setError("Gli indirizzi email inseriti non coincidono.");
      return;
    }

    if (guestsCount > property.maxGuests) {
      setError(`Questa casa ospita al massimo ${property.maxGuests} persone.`);
      return;
    }

    const guestAddress = `${street}, ${zip} ${city}, ${country}`.trim();

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          guestName: `${title} ${guestName}`.trim(),
          guestSurname,
          guestEmail,
          guestPhone,
          guestAddress,
          guestsCount,
          checkIn,
          checkOut,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore nella creazione della prenotazione");
        return;
      }

      window.location.href = data.checkoutUrl;
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <a href={`/property/${params.slug}`} className={styles.backLink}>
        ← Torna alla casa
      </a>

      <div className={styles.layout}>
        <div>
          <div className={styles.stepper}>
            <div className={`${styles.stepBar} ${styles.stepBarActive}`} />
            <div className={styles.stepBar} />
            <div className={styles.stepBar} />
          </div>
          <div className={styles.stepLabels}>
            <span className={styles.stepLabelActive}>Dati personali</span>
            <span>Metodo di pagamento</span>
            <span>Fatto</span>
          </div>

          <div className={styles.card}>
            <h1 className={styles.title}>Inizia la prenotazione</h1>
            <p className={styles.subtitle}>Inserisci i tuoi dati personali</p>

            <div className={styles.titleChoice}>
              <label className={styles.titleOption}>
                <input
                  type="radio"
                  name="title"
                  checked={title === "Sig."}
                  onChange={() => setTitle("Sig.")}
                />
                Sig.
              </label>
              <label className={styles.titleOption}>
                <input
                  type="radio"
                  name="title"
                  checked={title === "Sig.ra"}
                  onChange={() => setTitle("Sig.ra")}
                />
                Sig.ra
              </label>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="guestName">
                    Nome <span className={styles.required}>*</span>
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
                  <label className={styles.label} htmlFor="guestSurname">
                    Cognome <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="guestSurname"
                    className={styles.input}
                    value={guestSurname}
                    onChange={(e) => setGuestSurname(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="guestEmail">
                    Indirizzo e-mail <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="guestEmail"
                    type="email"
                    className={styles.input}
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                  />
                  <span className={styles.hint}>Invieremo la conferma a questo indirizzo</span>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="confirmEmail">
                    Conferma l&apos;indirizzo email <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="confirmEmail"
                    type="email"
                    className={styles.input}
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="guestPhone">
                    Numero di telefono <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.phoneRow}>
                    <div className={styles.input} style={{ display: "flex", alignItems: "center" }}>
                      🇮🇹 +39
                    </div>
                    <input
                      id="guestPhone"
                      type="tel"
                      className={styles.input}
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      required
                    />
                  </div>
                  <span className={styles.hint}>Chiameremo solo se ne abbiamo bisogno.</span>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="street">
                    Indirizzo <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="street"
                    className={styles.input}
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.row3}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="zip">
                    CAP <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="zip"
                    className={styles.input}
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="city">
                    Città <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="city"
                    className={styles.input}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="country">
                    Paese <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="country"
                    className={styles.select}
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    <option value="Italia">Italia</option>
                    <option value="Croazia">Croazia</option>
                    <option value="Francia">Francia</option>
                    <option value="Germania">Germania</option>
                    <option value="Spagna">Spagna</option>
                    <option value="Svizzera">Svizzera</option>
                    <option value="Altro">Altro</option>
                  </select>
                </div>
              </div>

              <div className={styles.row2}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="guestsCount">
                    Numero di persone <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="guestsCount"
                    type="number"
                    min={1}
                    max={property?.maxGuests ?? undefined}
                    className={styles.input}
                    value={guestsCount}
                    onChange={(e) => setGuestsCount(Number(e.target.value) || 1)}
                    required
                  />
                </div>
                <div />
              </div>

              <label className={styles.consentRow}>
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                />
                Sì, desidero ricevere offerte esclusive via email. Posso annullare in qualsiasi
                momento. Trova maggiori informazioni nella{" "}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Privacy Policy
                </a>
                .
              </label>

              {error && <p className={styles.errorText}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading || loadingProperty}>
                {loading ? "Verifico disponibilità..." : "Avanti"}
              </button>
              <p className={styles.mockNote}>Non ti addebiteremo nulla in questa fase.</p>
            </form>
          </div>

          <div className={styles.trustRow}>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <ShieldIcon />
              </div>
              <div>
                <p className={styles.trustTitle}>Pagamento sicuro</p>
                <p className={styles.trustText}>I tuoi dati di pagamento sono sempre protetti.</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <HeadsetIcon />
              </div>
              <div>
                <p className={styles.trustTitle}>Assistenza sempre a disposizione</p>
                <p className={styles.trustText}>Servizio clienti pronto ad aiutarti.</p>
              </div>
            </div>
          </div>
        </div>

        <aside className={styles.recap}>
          {loadingProperty ? (
            <p className={styles.loadingText}>Caricamento...</p>
          ) : property ? (
            <>
              <div className={styles.recapHeader}>
                <div>
                  <p className={styles.recapMeta}>
                    {property.sqm} m² casa vacanza · {property.maxGuests} ospiti
                  </p>
                  <p className={styles.recapTitle}>{property.name}</p>
                </div>
                {property.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={property.image} alt={property.name} className={styles.recapThumb} />
                )}
              </div>

              <div className={styles.recapRating}>
                <StarIcon size={14} />
                {property.rating.toFixed(1)} ({property.reviews})
              </div>
              {property.address && <div className={styles.recapLocation}>{property.address}</div>}

              <hr className={styles.recapDivider} />

              {checkIn && checkOut ? (
                <div className={styles.recapRow}>
                  <span>
                    {new Date(checkIn).toLocaleDateString("it-IT")} →{" "}
                    {new Date(checkOut).toLocaleDateString("it-IT")} ({nights}{" "}
                    {nights === 1 ? "notte" : "notti"})
                  </span>
                </div>
              ) : (
                <div className={styles.recapRow}>
                  <span>Date da confermare</span>
                </div>
              )}
              <div className={styles.recapRow}>
                <span>{guestsCount} ospiti</span>
              </div>

              <hr className={styles.recapDivider} />

              {nights > 0 && (
                <div className={styles.recapRow}>
                  <span>
                    Prezzo per {nights} {nights === 1 ? "notte" : "notti"}
                  </span>
                  <span>
                    {total.toFixed(2)} {property.currency}
                  </span>
                </div>
              )}

              <div className={styles.recapTotalRow}>
                <span>Totale</span>
                <span>
                  {total.toFixed(2)} {property.currency}
                </span>
              </div>

              <button
                type="button"
                className={styles.recapLink}
                onClick={() => setShowCancellation(true)}
              >
                Visualizza le condizioni di cancellazione →
              </button>
            </>
          ) : (
            <p className={styles.errorText}>Casa non trovata.</p>
          )}
        </aside>
      </div>

      {showCancellation && property && (
        <div className={styles.modalOverlay} onClick={() => setShowCancellation(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Condizioni di cancellazione</h3>
            <p className={styles.modalText}>{property.cancellationPolicy}</p>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setShowCancellation(false)}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
