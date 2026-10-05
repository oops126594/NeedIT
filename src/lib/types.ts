export type LocalizedText = {
  ar: string;
  en: string;
};

export type CategoryId =
  | "school"
  | "home"
  | "tech"
  | "car"
  | "gifts"
  | "party"
  | "pets"
  | "stationery";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type Store = {
  id: string;
  name: LocalizedText;
  area: LocalizedText;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  deliveryMinMinutes: number;
  deliveryMaxMinutes: number;
  categories: CategoryId[];
  isOpen: boolean;
  /** 0–1 merchant reliability used only for ranking. */
  reliability: number;
};

export type Product = {
  id: string;
  storeId: string;
  name: LocalizedText;
  description: LocalizedText;
  categoryId: CategoryId;
  brand: LocalizedText;
  priceHalalas: number;
  stock: StockStatus;
  keywords: string[];
  /** Internal freshness marker. Not a live inventory feed. */
  inventoryUpdatedAt: string;
};

export type PaymentMethod = "COD" | "CARD";

export type CartLine = {
  productId: string;
  quantity: number;
};

export type DeliveryAddress = {
  recipient: string;
  phone: string;
  district: string;
  line: string;
  instructions: string;
};

export type OrderLine = {
  productId: string;
  name: LocalizedText;
  quantity: number;
  priceHalalas: number;
};

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "COURIER_ASSIGNED"
  | "PICKED_UP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REJECTED"
  | "FAILED";

export type FrozenStatus = "CANCELLED" | "REJECTED" | "FAILED";

export type CustomerOrder = {
  id: string;
  createdAt: number;
  storeId: string;
  storeName: LocalizedText;
  lines: OrderLine[];
  subtotalHalalas: number;
  deliveryFeeHalalas: number;
  totalHalalas: number;
  address: DeliveryAddress;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  etaMinMinutes: number;
  etaMaxMinutes: number;
  frozenStatus?: FrozenStatus;
  notifiedStatus: OrderStatus;
  rating?: number;
};

export type AppNotification = {
  id: string;
  createdAt: number;
  orderId: string;
  status: OrderStatus;
  read: boolean;
};

export type SupportIssue =
  | "missing"
  | "wrong"
  | "damaged"
  | "late"
  | "cancelled"
  | "payment"
  | "merchant"
  | "other";

export type SupportTicket = {
  id: string;
  createdAt: number;
  orderId?: string;
  type: SupportIssue;
  message: string;
};

export type AnalyticsName =
  | "app_opened"
  | "search_started"
  | "search_completed"
  | "product_viewed"
  | "store_viewed"
  | "product_added_to_cart"
  | "checkout_started"
  | "order_created"
  | "order_cancelled"
  | "order_delivered"
  | "review_submitted";
