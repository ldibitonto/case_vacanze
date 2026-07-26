"use client";

import { Component, ReactNode } from "react";
import styles from "./MapPreview.module.css";

// Isola eventuali errori della mappa (Leaflet) dal resto della home: senza
// questo boundary, un errore qui rompeva anche l'interattività della search
// bar e delle date, perché faceva crashare tutto l'albero client della
// homepage, non solo il riquadro della mappa.
export class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[map] Errore nel rendering della mappa:", error);
  }

  render() {
    if (this.state.hasError) {
      return <div className={styles.placeholder}>Mappa non disponibile al momento.</div>;
    }
    return this.props.children;
  }
}
