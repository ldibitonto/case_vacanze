type IconProps = { size?: number; className?: string };

const base = (size = 16) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export function ChevronLeftIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function ChevronRightIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export function ExpandIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function WifiIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12.5a11 11 0 0 1 14 0" />
      <path d="M8.2 15.8a6.5 6.5 0 0 1 7.6 0" />
      <path d="M11.3 19a2 2 0 0 1 1.4 0" />
    </svg>
  );
}

export function ParkingIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M9 16V7h3.5a2.75 2.75 0 0 1 0 5.5H9" />
    </svg>
  );
}

export function PoolIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 17c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0 2.4-1 3.6 0 2.4 1 3.6 0" />
      <path d="M3 21c1.2 1 2.4 1 3.6 0s2.4-1 3.6 0 2.4 1 3.6 0 2.4-1 3.6 0 2.4 1 3.6 0" />
      <path d="M7 13V5a2 2 0 1 1 4 0v3" />
      <path d="M13 13V7l4-3" />
    </svg>
  );
}

export function AcIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2v20" />
      <path d="M4.9 4.9l14.2 14.2" />
      <path d="M19.1 4.9L4.9 19.1" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function PetsIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="6" cy="8" r="1.6" />
      <circle cx="10.5" cy="5" r="1.6" />
      <circle cx="15.5" cy="5" r="1.6" />
      <circle cx="19" cy="8" r="1.6" />
      <path d="M6.5 20c-1.6 0-2.5-1.7-1.6-3.2l2-3.3c1.1-1.8 2.9-2.8 4.9-2.8h.4c2 0 3.8 1 4.9 2.8l2 3.3c.9 1.5 0 3.2-1.6 3.2-1.6 0-2.3-.9-4-.9h-3c-1.7 0-2.4.9-4 .9Z" />
    </svg>
  );
}

export function KitchenIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 2v7a3 3 0 0 0 3 3v10" />
      <path d="M6 2v5M9 2v5" />
      <path d="M17 2c-1.7 0-3 2-3 5s1.3 5 3 5v10" />
    </svg>
  );
}

export function SeaViewIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8" r="3" />
      <path d="M2 14c1.3 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0 2.6-1 4 0 2.6 1 4 0" />
      <path d="M2 18c1.3 1 2.6 1 4 0s2.6-1 4 0 2.6 1 4 0 2.6-1 4 0 2.6 1 4 0" />
    </svg>
  );
}

export function GardenIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21v-8" />
      <path d="M12 13c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z" />
      <path d="M12 13c0-4 3-7 7-7 0 4-3 7-7 7Z" />
    </svg>
  );
}

export function StarIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} fill="currentColor" stroke="none">
      <path d="M12 2.5l2.9 6 6.6.8-4.8 4.6 1.2 6.5L12 17.3 6.1 20.4l1.2-6.5-4.8-4.6 6.6-.8Z" />
    </svg>
  );
}

export function HeartIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 20s-7-4.4-9.3-8.8C1.2 8 2.4 4.8 5.4 4c2-.5 3.9.3 5 2 .6.9 1.6.9 2.2 0 1.1-1.7 3-2.5 5-2 3 .8 4.2 4 3.7 7.2C19 15.6 12 20 12 20Z" />
    </svg>
  );
}

export function ShareIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3v12" />
      <path d="M8 7l4-4 4 4" />
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

export function FilterIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6h16" />
      <path d="M7 12h10" />
      <path d="M10 18h4" />
      <circle cx="8" cy="6" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PinIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.3" />
    </svg>
  );
}

export function CalendarIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
    </svg>
  );
}

export function GuestsIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16.5 4.3a3 3 0 0 1 0 5.8" />
      <path d="M19.5 20c0-2.9-1.9-5.1-4.5-5.8" />
    </svg>
  );
}

export function UserCircleIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19a6 6 0 0 1 11 0" />
    </svg>
  );
}

export function BriefcaseIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

export function LogoutIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function MenuIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

// --- Icone servizi aggiuntivi (galleria "Cosa offre questa casa") ---

export function DishwasherIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 8h16" />
      <circle cx="8" cy="5.5" r="0.6" fill="currentColor" stroke="none" />
      <rect x="7" y="11" width="10" height="7" rx="1.5" />
      <path d="M9 14.5a3 3 0 0 0 6 0" />
    </svg>
  );
}

export function WasherIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M4 7h16" />
      <circle cx="7" cy="5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13.5" r="4.2" />
      <circle cx="12" cy="13.5" r="1.6" />
    </svg>
  );
}

export function TvIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="5" width="18" height="12" rx="2" />
      <path d="M9 21h6" />
      <path d="M12 17v4" />
    </svg>
  );
}

export function MicrowaveIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <rect x="6" y="9" width="9" height="6" rx="1" />
      <circle cx="18" cy="10.5" r="0.6" fill="currentColor" stroke="none" />
      <path d="M16.5 13.5h3" />
    </svg>
  );
}

export function CribIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="6" width="16" height="9" rx="1.5" />
      <path d="M7 6v9M10 6v9M14 6v9M17 6v9" />
      <path d="M5 15v3M19 15v3" />
    </svg>
  );
}

export function NoSmokingIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5 16h9a2 2 0 0 0 0-4" />
      <path d="M5.5 5.5l13 13" />
    </svg>
  );
}

export function BbqIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 11a6 6 0 0 0 12 0Z" />
      <path d="M6 11h12" />
      <path d="M9 17l-2 4M15 17l2 4M12 17v4" />
      <path d="M9 5c-1 1-1 2 0 3M12 4c-1 1-1 2 0 3M15 5c-1 1-1 2 0 3" />
    </svg>
  );
}

export function HairdryerIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 5a5 5 0 0 1 5 5v1a3 3 0 0 1-3 3h-1" />
      <path d="M10 14v3a2 2 0 0 1-2 2H7" />
      <path d="M17 8h3M18 10.5h2.5M17 13h3" />
    </svg>
  );
}

export function CoffeeMachineIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5" y="3" width="14" height="9" rx="1.5" />
      <path d="M9 12v2H7l-1 6h12l-1-6h-2v-2" />
      <circle cx="16" cy="6" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HeatingIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="4" width="16" height="15" rx="1.5" />
      <path d="M8 4v15M12 4v15M16 4v15" />
    </svg>
  );
}

export function FridgeIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M5 9h14" />
      <path d="M8 4.5v2M8 11.5v2" />
    </svg>
  );
}

export function FreezerIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 8v8M8.5 10l7 4M15.5 10l-7 4" />
    </svg>
  );
}

export function MountainViewIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="18" cy="6" r="2" />
      <path d="M2 19l6.5-9 4 5 2-2.5L21 19Z" />
    </svg>
  );
}

export function SmokeDetectorIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FencedIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 9l3-3 3 3v11H4Z" />
      <path d="M11 9l3-3 3 3v11h-6Z" />
      <path d="M18 9l3-3v11h-3Z" />
      <path d="M2 14h20" />
    </svg>
  );
}

export function TerraceIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 20h18" />
      <path d="M4 20V9M20 20V9" />
      <path d="M4 9h16" />
      <path d="M7 9v11M11 9v11M15 9v11" />
    </svg>
  );
}

export function GardenFurnitureIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 12V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v7" />
      <path d="M5 12h14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1Z" />
      <path d="M6 17v3M18 17v3" />
    </svg>
  );
}

export function WinterReadyIcon({ size, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2v20M4 7l16 10M20 7L4 17" />
    </svg>
  );
}

export const amenityIcon: Record<string, (p: IconProps) => JSX.Element> = {
  wifi: WifiIcon,
  parking: ParkingIcon,
  pool: PoolIcon,
  ac: AcIcon,
  pets: PetsIcon,
  kitchen: KitchenIcon,
  "sea-view": SeaViewIcon,
  garden: GardenIcon,
  dishwasher: DishwasherIcon,
  washer: WasherIcon,
  tv: TvIcon,
  microwave: MicrowaveIcon,
  crib: CribIcon,
  "no-smoking": NoSmokingIcon,
  bbq: BbqIcon,
  hairdryer: HairdryerIcon,
  "coffee-machine": CoffeeMachineIcon,
  heating: HeatingIcon,
  fridge: FridgeIcon,
  freezer: FreezerIcon,
  "mountain-view": MountainViewIcon,
  "smoke-detector": SmokeDetectorIcon,
  fenced: FencedIcon,
  terrace: TerraceIcon,
  "garden-furniture": GardenFurnitureIcon,
  "winter-ready": WinterReadyIcon,
};
