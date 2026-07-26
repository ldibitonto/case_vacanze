"use client";

import dynamic from "next/dynamic";
import styles from "./MapPreview.module.css";
import type { Property } from "@/data/mockProperties";

// Leaflet manipola direttamente il DOM/window: va caricato solo lato client,
// mai durante il render server (altrimenti va in errore in SSR).
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className={styles.placeholder}>Caricamento mappa...</div>,
});

export function MapPreview({
  properties,
  activeId,
  onSelect,
}: {
  properties: Property[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  if (properties.length === 0) {
    return <div className={styles.placeholder}>Nessuna casa da mostrare sulla mappa.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <MapView properties={properties} activeId={activeId} onSelect={onSelect} />
    </div>
  );
}
