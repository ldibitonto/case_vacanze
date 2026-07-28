import { Plus_Jakarta_Sans } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

// Font più "accattivante" del semplice stack di system font usato prima:
// geometrico, arrotondato, con pesi ben distinti tra testo normale e
// titoli/bottoni in grassetto — vicino allo stile dei portali di viaggio
// presi a riferimento (HomeToGo). Esposto come variabile CSS così ogni
// modulo CSS del sito può usarlo senza doverlo re-importare.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata = {
  title: "Case Vacanze",
  description: "Sito vetrina e prenotazione per case vacanze",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={plusJakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
