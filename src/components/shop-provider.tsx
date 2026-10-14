"use client";

import { track } from "@/lib/analytics";
import { getProduct, getStore } from "@/lib/catalog";
import { getLocation, type LocationId, type MapPlace } from "@/lib/locations";
import { MAX_QUANTITY, displayStatus, storesInCart, summarizeCart } from "@/lib/orders";
import { emptyShop, loadShop, saveShop, type PersistedShop } from "@/lib/storage";
import type {
  AppNotification,
  CustomerOrder,
  DeliveryAddress,
  OrderStatus,
  PaymentMethod,
  SupportIssue,
  SupportTicket,
} from "@/lib/types";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AddFailure = { ok: false; reason: "unavailable" | "closed" | "other-store" };
type AddResult = { ok: true } | AddFailure;

type PlaceResult =
  | { ok: true; orderId: string }
  | { ok: false; reason: "empty" | "closed" | "unavailable" | "mixed" | "auth" | "invalid" };

type ShopContextValue = {
  ready: boolean;
  shop: PersistedShop;
  summary: ReturnType<typeof summarizeCart>;
  cartCount: number;
  orders: (CustomerOrder & { status: OrderStatus })[];
  unreadCount: number;
  locationId: LocationId;
  place: MapPlace | null;
  toast: "added" | "replaced" | null;
  addSearch: (query: string) => void;
  setLocation: (id: LocationId) => void;
  setPlace: (place: MapPlace) => void;
  addToCart: (productId: string, quantity: number) => AddResult;
  replaceCart: (productId: string, quantity: number) => AddResult;
  setQuantity: (productId: string, quantity: number) => void;
  placeOrder: (input: {
    address: DeliveryAddress;
    paymentMethod: PaymentMethod;
    cardLast4?: string;
  }) => Promise<PlaceResult>;
  cancelOrder: (id: string) => { ok: true } | { ok: false; reason: "not-found" | "too-late" };
  rateOrder: (id: string, rating: number) => void;
  markNotificationsRead: () => void;
  addTicket: (input: { orderId?: string; type: SupportIssue; message: string }) => SupportTicket;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function rememberSearch(list: string[], query: string): string[] {
  const next = [query, ...list.filter((item) => item.toLowerCase() !== query.toLowerCase())];
  return next.slice(0, 6);
}

function withQuantity(lines: PersistedShop["cart"], productId: string, quantity: number) {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) return [...lines, { productId, quantity: Math.min(MAX_QUANTITY, quantity) }];
  return lines.map((line) =>
    line.productId === productId
      ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) }
      : line,
  );
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<PersistedShop>(emptyShop);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [toast, setToast] = useState<"added" | "replaced" | null>(null);
  const shopRef = useRef(shop);
  const deliveredTracked = useRef(new Set<string>());
  shopRef.current = shop;

  useEffect(() => {
    const loaded = loadShop();
    setShop(loaded);
    setNow(Date.now());
    setReady(true);
    if (!sessionStorage.getItem("needit.opened")) {
      sessionStorage.setItem("needit.opened", "1");
      track("app_opened");
    }
  }, []);

  const [saveCart, setSaveCart] = useState(false);

  useEffect(() => {
    if (!ready) return;
    saveShop(shop);
  }, [shop, ready]);

  useEffect(() => {
    if (!ready) return;
    let alive = true;
    void fetch("/api/cart").then(async (response) => {
      if (!alive) return;
      if (!response.ok) {
        setSaveCart(false);
        return;
      }
      const data = (await response.json()) as { cart: { lines: PersistedShop["cart"] } | null };
      if (data.cart?.lines?.length) {
        setShop((prev) => (prev.cart.length > 0 ? prev : { ...prev, cart: data.cart?.lines ?? prev.cart }));
      }
      setSaveCart(true);
    });
    return () => {
      alive = false;
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !saveCart) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/cart", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lines: shop.cart }),
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [ready, saveCart, shop.cart]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const hasLiveOrder = shop.orders.some((order) => {
    if (order.frozenStatus) return false;
    return displayStatus(order, Date.now()) !== "DELIVERED";
  });

  useEffect(() => {
    if (!ready || !hasLiveOrder) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ready, hasLiveOrder]);

  useEffect(() => {
    if (!ready || now === 0) return;
    const pending = shopRef.current.orders.flatMap((order) => {
      const status = displayStatus(order, now);
      return status === order.notifiedStatus ? [] : [{ order, status }];
    });
    if (pending.length === 0) return;

    for (const item of pending) {
      if (item.status === "DELIVERED" && !deliveredTracked.current.has(item.order.id)) {
        deliveredTracked.current.add(item.order.id);
        track("order_delivered", { id: item.order.id });
      }
    }

    setShop((prev) => {
      const notifications = [...prev.notifications];
      let changed = false;
      const orders = prev.orders.map((order) => {
        const status = displayStatus(order, now);
        if (status === order.notifiedStatus) return order;
        changed = true;
        const id = `${order.id}:${status}`;
        if (!notifications.some((note) => note.id === id)) {
          notifications.unshift({
            id,
            createdAt: now,
            orderId: order.id,
            status,
            read: false,
          });
        }
        return { ...order, notifiedStatus: status };
      });
      if (!changed) return prev;
      return { ...prev, orders, notifications: notifications.slice(0, 40) };
    });
  }, [now, ready]);

  const summary = useMemo(() => summarizeCart(shop.cart), [shop.cart]);
  const orders = useMemo(
    () => shop.orders.map((order) => ({ ...order, status: displayStatus(order, now || Date.now()) })),
    [shop.orders, now],
  );
  const cartCount = shop.cart.reduce((sum, line) => sum + line.quantity, 0);
  const unreadCount = shop.notifications.filter((note) => !note.read).length;

  function guardAdd(
    productId: string,
    quantity: number,
    replace: boolean,
  ): AddFailure | { ok: true; next: PersistedShop["cart"] } {
    const product = getProduct(productId);
    const store = product ? getStore(product.storeId) : undefined;
    if (!product || product.stock === "OUT_OF_STOCK" || !store) return { ok: false, reason: "unavailable" };
    if (!store.isOpen) return { ok: false, reason: "closed" };
    const currentStores = storesInCart(shopRef.current.cart);
    if (!replace && currentStores.length > 0 && currentStores[0] !== product.storeId) {
      return { ok: false, reason: "other-store" };
    }
    const base = replace ? [] : shopRef.current.cart;
    return { ok: true, next: withQuantity(base, productId, Math.max(1, quantity)) };
  }

  const value: ShopContextValue = {
    ready,
    shop,
    summary,
    cartCount,
    orders,
    unreadCount,
    locationId: shop.locationId,
    place: shop.place,
    toast,
    addSearch: (query) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setShop((prev) => ({ ...prev, recentSearches: rememberSearch(prev.recentSearches, trimmed) }));
    },
    setLocation: (id) => setShop((prev) => ({ ...prev, locationId: id })),
    setPlace: (place) => setShop((prev) => ({ ...prev, place })),
    addToCart: (productId, quantity) => {
      const result = guardAdd(productId, quantity, false);
      if (!result.ok) return result;
      setShop((prev) => ({ ...prev, cart: result.next }));
      setToast("added");
      track("product_added_to_cart", { id: productId, quantity });
      return { ok: true };
    },
    replaceCart: (productId, quantity) => {
      const result = guardAdd(productId, quantity, true);
      if (!result.ok) return result;
      setShop((prev) => ({ ...prev, cart: result.next }));
      setToast("replaced");
      track("product_added_to_cart", { id: productId, quantity });
      return { ok: true };
    },
    setQuantity: (productId, quantity) => {
      setShop((prev) => ({
        ...prev,
        cart:
          quantity < 1
            ? prev.cart.filter((line) => line.productId !== productId)
            : prev.cart.map((line) =>
                line.productId === productId
                  ? { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }
                  : line,
              ),
      }));
    },
    placeOrder: async ({ address, paymentMethod, cardLast4 }) => {
      const current = shopRef.current;
      const cartSummary = summarizeCart(current.cart);
      const storeIds = storesInCart(current.cart);
      if (!cartSummary.store || cartSummary.detailed.length === 0) return { ok: false, reason: "empty" };
      if (storeIds.length !== 1) return { ok: false, reason: "mixed" };
      if (!cartSummary.store.isOpen) return { ok: false, reason: "closed" };
      if (cartSummary.detailed.some((item) => item.product.stock === "OUT_OF_STOCK")) {
        return { ok: false, reason: "unavailable" };
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lines: cartSummary.detailed.map((item) => ({
            productId: item.product.id,
            quantity: item.line.quantity,
          })),
          address,
          paymentMethod,
          cardLast4,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: PlaceResult extends { ok: false; reason: infer Reason } ? Reason : never;
        order?: CustomerOrder & { status: OrderStatus };
      } | null;
      if (response.status === 401) return { ok: false, reason: "auth" };
      if (!response.ok || !data?.order) {
        const reason = data?.error;
        if (reason === "empty" || reason === "closed" || reason === "unavailable" || reason === "mixed" || reason === "invalid") {
          return { ok: false, reason };
        }
        return { ok: false, reason: "unavailable" };
      }

      const saved = data.order;
      const order: CustomerOrder = {
        ...saved,
        notifiedStatus: saved.status,
        persistedStatus: saved.status,
      };
      const note: AppNotification = {
        id: `${order.id}:PLACED`,
        createdAt: order.createdAt,
        orderId: order.id,
        status: "PLACED",
        read: false,
      };
      setShop((prev) => ({
        ...prev,
        cart: [],
        savedAddress: address,
        orders: [order, ...prev.orders.filter((item) => item.id !== order.id)],
        notifications: [note, ...prev.notifications.filter((item) => item.id !== note.id)].slice(0, 40),
      }));
      track("order_created", { id: order.id });
      return { ok: true, orderId: order.id };
    },
    cancelOrder: (id) => {
      const current = shopRef.current.orders.find((order) => order.id === id);
      if (!current) return { ok: false, reason: "not-found" };
      const status = displayStatus(current, Date.now());
      if (status !== "PLACED" && status !== "ACCEPTED") return { ok: false, reason: "too-late" };
      const createdAt = Date.now();
      const note: AppNotification = {
        id: `${id}:CANCELLED`,
        createdAt,
        orderId: id,
        status: "CANCELLED",
        read: false,
      };
      setShop((prev) => ({
        ...prev,
        orders: prev.orders.map((order) =>
          order.id === id ? { ...order, frozenStatus: "CANCELLED", notifiedStatus: "CANCELLED" } : order,
        ),
        notifications: [note, ...prev.notifications.filter((item) => item.id !== note.id)].slice(0, 40),
      }));
      track("order_cancelled", { id });
      return { ok: true };
    },
    rateOrder: (id, rating) => {
      if (rating < 1 || rating > 5) return;
      const current = shopRef.current.orders.find((order) => order.id === id);
      if (!current || current.rating || displayStatus(current, Date.now()) !== "DELIVERED") return;
      setShop((prev) => ({
        ...prev,
        orders: prev.orders.map((order) => (order.id === id ? { ...order, rating } : order)),
      }));
      track("review_submitted", { id, rating });
    },
    markNotificationsRead: () => {
      setShop((prev) => ({
        ...prev,
        notifications: prev.notifications.map((note) => ({ ...note, read: true })),
      }));
    },
    addTicket: ({ orderId, type, message }) => {
      const ticket: SupportTicket = {
        id: `ST-${Date.now()}`,
        createdAt: Date.now(),
        orderId: orderId?.trim() || undefined,
        type,
        message: message.trim(),
      };
      setShop((prev) => ({ ...prev, tickets: [ticket, ...prev.tickets].slice(0, 30) }));
      return ticket;
    },
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop must be used within ShopProvider");
  return context;
}

export function useLocationName() {
  const { locationId } = useShop();
  return getLocation(locationId);
}
