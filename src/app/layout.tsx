import "leaflet/dist/leaflet.css";
import "./globals.css";

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
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
