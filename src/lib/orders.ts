import { getProduct, getStore } from "@/lib/catalog";
import { DELIVERY_FEE_HALALAS, lineTotal } from "@/lib/money";
import type { CartLine, CustomerOrder, OrderStatus, Product, Store } from "@/lib/types";

export const MAX_QUANTITY = 8;

export const ORDER_FLOW = [
  "PLACED",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COURIER_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const satisfies readonly OrderStatus[];

/**
 * Prototype courier clock. Placed and accepted stay up long enough to cancel.
 * Later steps move faster. This is not a live dispatch.
 */
const STEP_AT_MS = [0, 15_000, 30_000, 36_000, 42_000, 48_000, 54_000, 60_000];

export function formatOrderId(sequence: number, now = new Date()): string {
  return `NE-${now.getFullYear()}-${String(sequence).padStart(6, "0")}`;
}

export function displayStatus(order: CustomerOrder, now: number): OrderStatus {
  if (order.frozenStatus) return order.frozenStatus;
  const elapsed = Math.max(0, now - order.createdAt);
  let index = 0;
  for (let step = 0; step < STEP_AT_MS.length; step += 1) {
    if (elapsed >= (STEP_AT_MS[step] ?? 0)) index = step;
  }
  return ORDER_FLOW[index] ?? "PLACED";
}

export function canCancel(status: OrderStatus): boolean {
  return status === "PLACED" || status === "ACCEPTED";
}

export function canRate(status: OrderStatus): boolean {
  return status === "DELIVERED";
}

export function arrivalMinutes(order: CustomerOrder, now: number): number | null {
  const status = displayStatus(order, now);
  if (order.frozenStatus || status === "DELIVERED") return null;
  const index = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
  const progress = Math.max(0, index) / (ORDER_FLOW.length - 1);
  return Math.max(4, Math.round(order.etaMaxMinutes * (1 - progress * 0.85)));
}

export function storesInCart(lines: CartLine[]): string[] {
  const ids = new Set(
    lines.flatMap((line) => {
      const product = getProduct(line.productId);
      return product ? [product.storeId] : [];
    }),
  );
  return [...ids];
}

export type CartDetail = {
  line: CartLine;
  product: Product;
  lineHalalas: number;
};

export type CartSummary = {
  store: Store | null;
  detailed: CartDetail[];
  subtotal: number;
  delivery: number;
  total: number;
};

export function summarizeCart(lines: CartLine[]): CartSummary {
  const detailed = lines.flatMap((line) => {
    const product = getProduct(line.productId);
    if (!product) return [];
    return [{ line, product, lineHalalas: lineTotal(product.priceHalalas, line.quantity) }];
  });
  const storeId = detailed[0]?.product.storeId;
  const store = storeId ? (getStore(storeId) ?? null) : null;
  const subtotal = detailed.reduce((sum, item) => sum + item.lineHalalas, 0);
  const delivery = detailed.length > 0 ? DELIVERY_FEE_HALALAS : 0;
  return { store, detailed, subtotal, delivery, total: subtotal + delivery };
}
