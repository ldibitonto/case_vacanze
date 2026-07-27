"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./PropertyCard.module.css";
import { amenityIcon, HeartIcon, ShareIcon, StarIcon } from "./icons";
import type { Property } from "@/data/mockProperties";

export function PropertyCard({
  property,
  checkIn,
  checkOut,
  guests,
}: {
  property: Property;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  const [saved, setSaved] = useState(false);

  // Portiamo date e numero ospiti scelti nella home alla pagina della casa
  // solo se l'utente li ha effettivamente selezionati: altrimenti il
  // widget di prenotazione parte vuoto/con 1 ospite invece di ripartire da
  // zero senza motivo.
  const offerParams = new URLSearchParams();
  if (checkIn && checkOut) {
    offerParams.set("checkIn", checkIn);
    offerParams.set("checkOut", checkOut);
  }
  if (guests && guests > 0) {
    offerParams.set("guests", String(guests));
  }
  const offerQuery = offerParams.toString();
  const offerHref = `/property/${property.slug}${offerQuery ? `?${offerQuery}` : ""}`;

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={property.image} alt={property.title} className={styles.image} />
        <div className={styles.imageActions}>
          <button type="button" className={styles.roundBtn} aria-label="Condividi">
            <ShareIcon size={14} />
          </button>
          <button
            type="button"
            className={`${styles.roundBtn} ${saved ? styles.active : ""}`}
            aria-label="Salva nei preferiti"
            onClick={() => setSaved((v) => !v)}
          >
            <HeartIcon size={14} />
          </button>
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.meta}>
          {property.sqm} m² · casa vacanza · {property.guests} ospiti ·{" "}
          {property.bedrooms} {property.bedrooms === 1 ? "camera" : "camere"} da letto
        </p>
        <h3 className={styles.title}>{property.title}</h3>
        <p className={styles.location}>{property.location}</p>

        <div className={styles.amenities}>
          {property.amenities.map((a) => {
            const Icon = amenityIcon[a];
            return Icon ? <Icon key={a} size={16} /> : null;
          })}
        </div>

        <div className={styles.footer}>
          <div>
            <div className={styles.rating}>
              <StarIcon size={14} />
              <span>{property.rating.toFixed(1)}</span>
              <span className={styles.reviews}>({property.reviews} recensioni)</span>
            </div>
            {property.promotedBy && (
              <p className={styles.promoted}>Promosso da {property.promotedBy}</p>
            )}
          </div>

          <div className={styles.priceBlock}>
            <div className={styles.priceFrom}>da</div>
            <div className={styles.price}>
              {property.pricePerNight} {property.currency}
            </div>
            <div className={styles.priceUnit}>per notte</div>
            <Link href={offerHref} className={styles.cta}>
              Vai all&apos;offerta
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
