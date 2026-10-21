import { SERVICE_LOCATIONS } from "@/lib/locations";
import type { DeliveryAddress } from "@/lib/types";

export type LatLng = { lat: number; lng: number };

export const STORE_POINTS: Record<string, LatLng> = {
  watar: { lat: 24.7132, lng: 46.6754 },
  noor: { lat: 24.7215, lng: 46.688 },
  nakheel: { lat: 24.769, lng: 46.648 },
  qalam: { lat: 24.662, lng: 46.726 },
  bayt: { lat: 24.7005, lng: 46.702 },
  farah: { lat: 24.655, lng: 46.71 },
  sayyara: { lat: 24.658, lng: 46.732 },
  rafiq: { lat: 24.724, lng: 46.692 },
};

export const COURIER_BASES: Record<string, LatLng> = {
  "courier-bayan": { lat: 24.708, lng: 46.69 },
  "courier-fahad": { lat: 24.668, lng: 46.718 },
};

const RIYADH: LatLng = { lat: 24.711, lng: 46.674 };

export function storePoint(storeId: string): LatLng {
  return STORE_POINTS[storeId] ?? RIYADH;
}

export function courierBase(id: string): LatLng {
  return COURIER_BASES[id] ?? RIYADH;
}

export function dropPoint(address: DeliveryAddress): LatLng {
  if (typeof address.lat === "number" && typeof address.lng === "number") {
    return { lat: address.lat, lng: address.lng };
  }
  const haystack = `${address.district} ${address.line}`.toLowerCase();
  const match = SERVICE_LOCATIONS.find((location) => {
    const names = [location.district.en, location.district.ar, location.name.en, location.name.ar];
    return names.some((name) => haystack.includes(name.toLowerCase()));
  });
  return match ? { lat: match.lat, lng: match.lng } : RIYADH;
}

export function haversineKm(from: LatLng, to: LatLng): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** City pace, about 18 km/h, clamped for a short Riyadh trip. */
export function rideMinutes(from: LatLng, to: LatLng): number {
  const minutes = (haversineKm(from, to) / 18) * 60;
  return Math.max(2, Math.min(45, Math.round(minutes)));
}

export function along(from: LatLng, to: LatLng, progress: number): LatLng {
  const t = Math.min(1, Math.max(0, progress));
  return {
    lat: from.lat + (to.lat - from.lat) * t,
    lng: from.lng + (to.lng - from.lng) * t,
  };
}
