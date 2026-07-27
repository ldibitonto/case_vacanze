"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { MapPreview } from "@/components/home/MapPreview";
import { DateRangePicker } from "@/components/home/DateRangePicker";
import { amenityIcon, StarIcon } from "@/components/home/icons";
import { buildDisplayProperty } from "@/data/propertyExtras";
import { AMENITY_LABELS, amenityGroups } from "@/data/amenities";

// Pagina di dettaglio casa (destinazione di "Vai all'offerta"): galleria
// foto, tab informative (soggiorno/posizione/recensioni/disponibilità/
// cancellazione) e widget di prenotazione a destra. Le date arrivano
// precompilate dalla home solo se l'utente le aveva già scelte lì
// (?checkIn=&checkOut=), altrimenti si scelgono qui. Da qui si passa allo
// step "Inizia la prenotazione" (/property/[slug]/booking).

type PropertyDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  maxGuests: number;
  basePrice: string | number;
  currency: string;
  lat: number | null;
  lng: number | null;
  image: string | null;
  images: string[];
  amenities: string[];
  rating: number;
  reviews: number;
  sqm: number;
  promotedBy: string | null;
  cancellationPolicy: string;
};

type AvailabilityResponse = {
  blockedDates: { date: string; source: string }[];
  activeBookings: { checkIn: string; checkOut: string; status: string }[];
};

type PropertyReview = {
  id: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

const TABS = [
  { id: "soggiorno", label: "Il tuo soggiorno" },
  { id: "posizione", label: "Posizione" },
  { id: "recensioni", label: "Recensioni" },
  { id: "disponibilita", label: "Disponibilità" },
  { id: "cancellazione", label: "Cancellazione" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const AMENITIES_PREVIEW_COUNT = 8;

export default function PropertyDetailPage() {
  return (
    <Suspense fallback={null}>
      <PropertyDetailContent />
    </Suspense>
  );
}

function PropertyDetailContent() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [reviews, setReviews] = useState<PropertyReview[] | null>(null);

  const [tab, setTab] = useState<TabId>("soggiorno");

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") ?? "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") ?? "");
  const initialGuests = Number(searchParams.get("guests"));
  const [guests, setGuests] = useState(
    Number.isFinite(initialGuests) && initialGuests > 0 ? initialGuests : 1
  );
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [datesOpen, setDatesOpen] = useState(false);
  const datesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!datesOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (datesRef.current && !datesRef.current.contains(e.target as Node)) {
        setDatesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [datesOpen]);

  useEffect(() => {
    fetch("/api/properties")
      .then((res) => res.json())
      .then((list: PropertyDetail[]) => {
        const found = list.find((p) => p.slug === params.slug) ?? null;
        setProperty(found);
        setNotFound(!found);
      })
      .finally(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    fetch(`/api/properties/${params.slug}/availability`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setAvailability(data))
      .catch(() => setAvailability(null));
  }, [params.slug]);

  useEffect(() => {
    fetch(`/api/properties/${params.slug}/reviews`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PropertyReview[]) => setReviews(data))
      .catch(() => setReviews([]));
  }, [params.slug]);

  const galleryImages = useMemo(() => {
    if (!property) return [];
    const all = [property.image, ...(property.images ?? [])].filter(
      (v): v is string => Boolean(v)
    );
    return Array.from(new Set(all));
  }, [property]);

  const mapProperty = useMemo(() => {
    if (!property) return null;
    return buildDisplayProperty(
      {
        id: property.id,
        name: property.name,
        slug: property.slug,
        address: property.address,
        maxGuests: property.maxGuests,
        basePrice: property.basePrice,
        currency: property.currency,
        lat: property.lat,
        lng: property.lng,
        image: property.image,
        amenities: property.amenities,
        rating: property.rating,
        reviews: property.reviews,
        sqm: property.sqm,
        promotedBy: property.promotedBy,
      },
      0
    );
  }, [property]);

  // Navigazione della lightbox da tastiera: frecce per scorrere, Esc per chiudere.
  useEffect(() => {
    if (lightboxIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") {
        setLightboxIndex((i) => (i === null ? null : (i + 1) % galleryImages.length));
      }
      if (e.key === "ArrowLeft") {
        setLightboxIndex((i) =>
          i === null ? null : (i - 1 + galleryImages.length) % galleryImages.length
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, galleryImages.length]);

  function showPrev() {
    setLightboxIndex((i) => (i === null ? null : (i - 1 + galleryImages.length) % galleryImages.length));
  }

  function showNext() {
    setLightboxIndex((i) => (i === null ? null : (i + 1) % galleryImages.length));
  }

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
        )
      : 0;
  const total = property ? nights * Number(property.basePrice) : 0;

  function handleCheckAvailability() {
    setWidgetError(null);

    if (!property) return;

    if (!checkIn || !checkOut) {
      setWidgetError("Seleziona le date di arrivo e partenza.");
      return;
    }
    if (new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
      setWidgetError("La data di partenza deve essere dopo l'arrivo.");
      return;
    }
    if (guests > property.maxGuests) {
      setWidgetError(`Questa casa ospita al massimo ${property.maxGuests} persone.`);
      return;
    }

    setChecking(true);
    try {
      if (availability) {
        const inTime = new Date(checkIn).getTime();
        const outTime = new Date(checkOut).getTime();

        const blockedHit = availability.blockedDates.some((b) => {
          const t = new Date(b.date).getTime();
          return t >= inTime && t < outTime;
        });
        const bookingHit = availability.activeBookings.some((b) => {
          const bIn = new Date(b.checkIn).getTime();
          const bOut = new Date(b.checkOut).getTime();
          return bIn < outTime && bOut > inTime;
        });

        if (blockedHit || bookingHit) {
          setWidgetError("Le date selezionate non sono disponibili. Prova con altre date.");
          return;
        }
      }

      const qs = new URLSearchParams({ checkIn, checkOut, guests: String(guests) });
      router.push(`/property/${params.slug}/booking?${qs.toString()}`);
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.loadingText}>Caricamento...</p>
        </div>
      </main>
    );
  }

  if (notFound || !property) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p className={styles.errorText}>Casa non trovata.</p>
        </div>
      </main>
    );
  }

  const backToHomeHref = (() => {
    const qs = new URLSearchParams();
    if (checkIn) qs.set("checkIn", checkIn);
    if (checkOut) qs.set("checkOut", checkOut);
    const query = qs.toString();
    return `/${query ? `?${query}` : ""}`;
  })();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <a href={backToHomeHref} className={styles.backLink}>
          ← Torna alla ricerca
        </a>

        <div className={styles.gallery}>
          {galleryImages.length <= 1 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={galleryImages[0] ?? "https://picsum.photos/seed/casa-fallback/900/600"}
              alt={property.name}
              className={styles.galleryOnly}
              onClick={() => setLightboxIndex(0)}
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryImages[0]}
                alt={property.name}
                className={styles.galleryMain}
                onClick={() => setLightboxIndex(0)}
              />
              {galleryImages.slice(1, 5).map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={url + i}
                  src={url}
                  alt={property.name}
                  className={styles.galleryThumb}
                  onClick={() => setLightboxIndex(i + 1)}
                />
              ))}
            </>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.main}>
            <h1 className={styles.title}>{property.name}</h1>
            <div className={styles.metaRow}>
              <StarIcon size={14} />
              <strong>{property.rating.toFixed(1)}</strong>
              <span>({property.reviews} recensioni)</span>
              <span className={styles.dot}>·</span>
              <span>{property.sqm} m²</span>
              <span className={styles.dot}>·</span>
              <span>{property.maxGuests} ospiti</span>
              {property.address && (
                <>
                  <span className={styles.dot}>·</span>
                  <span>{property.address}</span>
                </>
              )}
            </div>

            <div className={styles.tabs}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`${styles.tabBtn} ${tab === t.id ? styles.tabBtnActive : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className={styles.tabPanel}>
              {tab === "soggiorno" && (
                <div>
                  <h3>Il tuo soggiorno</h3>
                  <p className={styles.descriptionText}>
                    {property.description || "Nessuna descrizione disponibile per questa casa."}
                  </p>

                  {property.amenities.length > 0 && (
                    <>
                      <h3 className={styles.amenitiesTitle}>Cosa offre questa casa</h3>
                      <div className={styles.amenitiesList}>
                        {property.amenities.slice(0, AMENITIES_PREVIEW_COUNT).map((a) => {
                          const Icon = amenityIcon[a];
                          return (
                            <div key={a} className={styles.amenityItem}>
                              {Icon ? <Icon size={16} /> : null}
                              {AMENITY_LABELS[a] ?? a}
                            </div>
                          );
                        })}
                      </div>
                      {property.amenities.length > AMENITIES_PREVIEW_COUNT && (
                        <button
                          type="button"
                          className={styles.showAllBtn}
                          onClick={() => setShowAllAmenities(true)}
                        >
                          Mostra tutti i {property.amenities.length} servizi →
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {tab === "posizione" && (
                <div>
                  <h3>Posizione</h3>
                  <p>{property.address || "Indirizzo non disponibile."}</p>
                  {mapProperty && (
                    <div className={styles.mapWrap}>
                      <MapPreview properties={[mapProperty]} />
                    </div>
                  )}
                  {property.lat && property.lng && (
                    <div className={styles.mapLinkRow}>
                      <a
                        className={styles.mapLink}
                        href={`https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Apri in Google Maps →
                      </a>
                    </div>
                  )}
                </div>
              )}

              {tab === "recensioni" && (
                <div>
                  <h3>Recensioni</h3>
                  {(() => {
                    const realReviews = reviews ?? [];
                    const hasRealReviews = realReviews.length > 0;
                    const avgRating = hasRealReviews
                      ? realReviews.reduce((sum, r) => sum + r.rating, 0) / realReviews.length
                      : property.rating;
                    const count = hasRealReviews ? realReviews.length : property.reviews;

                    return (
                      <>
                        <div className={styles.ratingBig}>
                          <span className={styles.ratingBigNumber}>{avgRating.toFixed(1)}</span>
                          <span>su 5 · {count} recensioni</span>
                        </div>

                        {reviews === null && <p>Caricamento recensioni...</p>}

                        {reviews !== null && !hasRealReviews && (
                          <p>
                            {property.reviews > 0
                              ? "Le recensioni scritte dagli ospiti compariranno qui non appena disponibili."
                              : "Questa casa non ha ancora recensioni."}
                          </p>
                        )}

                        {hasRealReviews && (
                          <div className={styles.reviewsList}>
                            {realReviews.map((r) => (
                              <div key={r.id} className={styles.reviewCard}>
                                <div className={styles.reviewHeader}>
                                  <span className={styles.reviewAuthor}>{r.guestName}</span>
                                  <span className={styles.reviewDate}>
                                    {new Date(r.createdAt).toLocaleDateString("it-IT", {
                                      month: "long",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className={styles.reviewStars}>
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <StarIcon
                                      key={n}
                                      size={14}
                                      className={n <= r.rating ? styles.starFilled : styles.starEmpty}
                                    />
                                  ))}
                                </div>
                                <p className={styles.reviewComment}>{r.comment}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {tab === "disponibilita" && (
                <div>
                  <h3>Disponibilità</h3>
                  {!availability && <p>Caricamento calendario disponibilità...</p>}
                  {availability && availability.activeBookings.length === 0 && (
                    <p className={styles.availEmpty}>
                      Nessuna prenotazione attiva al momento: scegli le date che preferisci nel
                      box a destra.
                    </p>
                  )}
                  {availability && availability.activeBookings.length > 0 && (
                    <ul className={styles.availList}>
                      {availability.activeBookings.map((b, i) => (
                        <li key={i} className={styles.availItem}>
                          Non disponibile dal {new Date(b.checkIn).toLocaleDateString("it-IT")} al{" "}
                          {new Date(b.checkOut).toLocaleDateString("it-IT")}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {tab === "cancellazione" && (
                <div>
                  <h3>Politica di cancellazione</h3>
                  <p>{property.cancellationPolicy}</p>
                </div>
              )}
            </div>
          </div>

          <aside className={styles.widget}>
            <div className={styles.widgetPrice}>
              {Number(property.basePrice).toFixed(2)} {property.currency}
              <span className={styles.widgetPriceUnit}>/ notte</span>
            </div>

            <div className={styles.widgetDatesWrap} ref={datesRef}>
              <div
                className={`${styles.widgetDates} ${datesOpen ? styles.widgetDatesActive : ""}`}
                onClick={() => setDatesOpen(true)}
              >
                <div className={styles.widgetDateField}>
                  <span className={styles.widgetDateLabel}>Arrivo</span>
                  <span>{checkIn ? new Date(checkIn).toLocaleDateString("it-IT") : "Aggiungi data"}</span>
                </div>
                <div className={styles.widgetDateField}>
                  <span className={styles.widgetDateLabel}>Partenza</span>
                  <span>{checkOut ? new Date(checkOut).toLocaleDateString("it-IT") : "Aggiungi data"}</span>
                </div>
              </div>

              {datesOpen && (
                <div className={styles.widgetDatesPopup}>
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={(ci, co) => {
                      setCheckIn(ci);
                      setCheckOut(co);
                    }}
                    onClose={() => setDatesOpen(false)}
                  />
                </div>
              )}
            </div>

            <div className={styles.widgetGuests}>
              <span className={styles.widgetDateLabel}>Ospiti</span>
              <div className={styles.widgetGuestsStepper}>
                <button
                  type="button"
                  className={styles.widgetStepperBtn}
                  disabled={guests <= 1}
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                  aria-label="Diminuisci numero di ospiti"
                >
                  −
                </button>
                <span className={styles.widgetGuestsValue}>{guests}</span>
                <button
                  type="button"
                  className={styles.widgetStepperBtn}
                  disabled={guests >= property.maxGuests}
                  onClick={() => setGuests(Math.min(property.maxGuests, guests + 1))}
                  aria-label="Aumenta numero di ospiti"
                >
                  +
                </button>
              </div>
            </div>

            {widgetError && <p className={styles.widgetError}>{widgetError}</p>}

            <button
              type="button"
              className={styles.widgetBtn}
              onClick={handleCheckAvailability}
              disabled={checking}
            >
              {checking ? "Verifico..." : "Verifica disponibilità"}
            </button>

            {nights > 0 && (
              <div className={styles.widgetBreakdown}>
                <div className={styles.widgetRow}>
                  <span>
                    {Number(property.basePrice).toFixed(2)} {property.currency} × {nights}{" "}
                    {nights === 1 ? "notte" : "notti"}
                  </span>
                  <span>
                    {total.toFixed(2)} {property.currency}
                  </span>
                </div>
                <div className={styles.widgetTotalRow}>
                  <span>Totale</span>
                  <span>
                    {total.toFixed(2)} {property.currency}
                  </span>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      {showAllAmenities && (
        <div className={styles.modalOverlay} onClick={() => setShowAllAmenities(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Cosa offre questa casa</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setShowAllAmenities(false)}
                aria-label="Chiudi"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              {amenityGroups().map((group) => {
                const items = group.items.filter((i) => property.amenities.includes(i.value));
                if (items.length === 0) return null;
                return (
                  <div key={group.id} className={styles.modalGroup}>
                    <p className={styles.modalGroupTitle}>{group.label}</p>
                    <div className={styles.amenitiesList}>
                      {items.map((i) => {
                        const Icon = amenityIcon[i.value];
                        return (
                          <div key={i.value} className={styles.amenityItem}>
                            {Icon ? <Icon size={16} /> : null}
                            {i.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {lightboxIndex !== null && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxIndex(null)}>
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxIndex(null)}
            aria-label="Chiudi"
          >
            ×
          </button>

          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.lightboxMainRow}>
              {galleryImages.length > 1 && (
                <button
                  type="button"
                  className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`}
                  onClick={showPrev}
                  aria-label="Foto precedente"
                >
                  ‹
                </button>
              )}

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={galleryImages[lightboxIndex]}
                alt={property.name}
                className={styles.lightboxImage}
              />

              {galleryImages.length > 1 && (
                <button
                  type="button"
                  className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`}
                  onClick={showNext}
                  aria-label="Foto successiva"
                >
                  ›
                </button>
              )}
            </div>

            <p className={styles.lightboxCounter}>
              {lightboxIndex + 1} / {galleryImages.length}
            </p>

            {galleryImages.length > 1 && (
              <div className={styles.lightboxThumbs}>
                {galleryImages.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url + i}
                    src={url}
                    alt={`${property.name} - foto ${i + 1}`}
                    className={`${styles.lightboxThumb} ${
                      i === lightboxIndex ? styles.lightboxThumbActive : ""
                    }`}
                    onClick={() => setLightboxIndex(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
