"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { Property } from "@/data/mockProperties";

// Le icone di default di Leaflet si rompono col bundling di webpack (i path
// relativi alle immagini non si risolvono). Le puntiamo esplicitamente al
// CDN ufficiale invece di gestire l'import degli asset.
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const activeIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [34, 56],
  iconAnchor: [17, 56],
  popupAnchor: [1, -46],
  shadowSize: [56, 56],
});

// Adatta automaticamente zoom/centro della mappa per includere tutte le
// proprietà visibili (cambia quando il filtro date riduce la lista).
function FitBounds({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length === 0) return;
    if (properties.length === 1) {
      map.setView([properties[0].lat, properties[0].lng], 11);
      return;
    }
    const bounds = L.latLngBounds(properties.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [properties, map]);

  return null;
}

export default function MapView({
  properties,
  activeId,
  onSelect,
}: {
  properties: Property[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const center = useMemo<[number, number]>(() => {
    if (properties.length === 0) return [41.9028, 12.4964]; // Roma, centro Italia
    return [properties[0].lat, properties[0].lng];
  }, [properties]);

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ width: "100%", height: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds properties={properties} />
      {properties.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={activeId === p.id ? activeIcon : defaultIcon}
          eventHandlers={{ click: () => onSelect?.(p.id) }}
        >
          <Popup>
            <strong>{p.title}</strong>
            <br />
            {p.location}
            <br />
            da {p.pricePerNight} {p.currency}/notte
            <br />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Apri in Google Maps
            </a>
            {" · "}
            <a href={`/property/${p.slug}`}>Vai all&apos;offerta</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
