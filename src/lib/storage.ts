import { isLocationId, type LocationId, type MapPlace } from "@/lib/locations";
import type {
  AppNotification,
  CartLine,
  CustomerOrder,
  DeliveryAddress,
  SupportTicket,
} from "@/lib/types";

const KEY = "needit.shop.v1";

export type PersistedShop = {
  cart: CartLine[];
  orders: CustomerOrder[];
  /** Next id uses this value plus one. 122 makes the first order NE-2026-000123. */
  orderSeq: number;
  recentSearches: string[];
  notifications: AppNotification[];
  tickets: SupportTicket[];
  locationId: LocationId;
  place: MapPlace | null;
  savedAddress: DeliveryAddress | null;
};

export function emptyShop(): PersistedShop {
  return {
    cart: [],
    orders: [],
    orderSeq: 122,
    recentSearches: [],
    notifications: [],
    tickets: [],
    locationId: "olaya",
    place: null,
    savedAddress: null,
  };
}

function readPlace(value: unknown): MapPlace | null {
  if (!isRecord(value)) return null;
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (typeof value.label !== "string" || typeof value.district !== "string") return null;
  return { lat, lng, label: value.label, district: value.district };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCart(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((line) => {
    if (!isRecord(line) || typeof line.productId !== "string") return [];
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return [];
    return [{ productId: line.productId, quantity: Math.min(8, quantity) }];
  });
}

function readOrders(value: unknown): CustomerOrder[] {
  if (!Array.isArray(value)) return [];
  return value.filter((order): order is CustomerOrder => {
    if (!isRecord(order)) return false;
    return typeof order.id === "string" && typeof order.createdAt === "number" && Array.isArray(order.lines);
  });
}

export function loadShop(): PersistedShop {
  if (typeof window === "undefined") return emptyShop();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyShop();
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return emptyShop();
    const base = emptyShop();
    return {
      cart: readCart(parsed.cart),
      orders: readOrders(parsed.orders),
      orderSeq: typeof parsed.orderSeq === "number" ? parsed.orderSeq : base.orderSeq,
      recentSearches: Array.isArray(parsed.recentSearches)
        ? parsed.recentSearches.filter((item): item is string => typeof item === "string").slice(0, 6)
        : [],
      notifications: Array.isArray(parsed.notifications)
        ? (parsed.notifications as AppNotification[]).slice(0, 40)
        : [],
      tickets: Array.isArray(parsed.tickets) ? (parsed.tickets as SupportTicket[]).slice(0, 30) : [],
      locationId: typeof parsed.locationId === "string" && isLocationId(parsed.locationId)
        ? parsed.locationId
        : "olaya",
      place: readPlace(parsed.place),
      savedAddress: isRecord(parsed.savedAddress) ? (parsed.savedAddress as DeliveryAddress) : null,
    };
  } catch {
    return emptyShop();
  }
}

export function saveShop(shop: PersistedShop): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(shop));
  } catch {
    // A full disk should not crash checkout.
  }
}
