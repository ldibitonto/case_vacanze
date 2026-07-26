/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disattivato: React 18 Strict Mode monta/smonta/rimonta ogni componente
  // due volte in sviluppo per scovare side-effect impuri, ma Leaflet non
  // sopporta di essere inizializzato due volte sullo stesso nodo DOM
  // ("Map container is already initialized") e questo mandava in errore
  // l'intero albero client della home, rompendo anche i campi data.
  reactStrictMode: false,
};

export default nextConfig;
