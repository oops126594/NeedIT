import type { LocalizedText } from "@/lib/types";

export const SERVICE_LOCATIONS = [
  {
    id: "olaya",
    name: { en: "Al Olaya, Riyadh", ar: "العليا، الرياض" },
    district: { en: "Al Olaya", ar: "العليا" },
  },
  {
    id: "malaz",
    name: { en: "Al Malaz, Riyadh", ar: "الملز، الرياض" },
    district: { en: "Al Malaz", ar: "الملز" },
  },
  {
    id: "nakheel",
    name: { en: "Al Nakheel, Riyadh", ar: "النخيل، الرياض" },
    district: { en: "Al Nakheel", ar: "النخيل" },
  },
] as const satisfies readonly {
  id: string;
  name: LocalizedText;
  district: LocalizedText;
}[];

export type LocationId = (typeof SERVICE_LOCATIONS)[number]["id"];

export function isLocationId(value: string): value is LocationId {
  return SERVICE_LOCATIONS.some((location) => location.id === value);
}

export function getLocation(id: string) {
  return SERVICE_LOCATIONS.find((location) => location.id === id) ?? SERVICE_LOCATIONS[0];
}
