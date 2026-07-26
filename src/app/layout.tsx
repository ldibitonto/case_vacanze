import "leaflet/dist/leaflet.css";

export const metadata = {
  title: "Case Vacanze",
  description: "Sito vetrina e prenotazione per case vacanze",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
