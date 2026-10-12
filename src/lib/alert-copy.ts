import type { AppLocale } from "@/i18n/routing";
import type { OrderStatus } from "@/lib/types";

const COPY: Record<AppLocale, Record<OrderStatus, { title: string; body: string }>> = {
  en: {
    PLACED: { title: "Order placed", body: "The store has your order." },
    ACCEPTED: { title: "Store accepted your order", body: "The store accepted it." },
    PREPARING: { title: "Being prepared", body: "The store is packing it." },
    READY_FOR_PICKUP: { title: "Ready for pickup", body: "Waiting for the courier." },
    COURIER_ASSIGNED: { title: "Courier assigned", body: "A courier is heading to the store." },
    PICKED_UP: { title: "Order picked up", body: "The courier has the order." },
    OUT_FOR_DELIVERY: { title: "On the way", body: "It is on the way to you." },
    DELIVERED: { title: "Delivered", body: "It has arrived." },
    CANCELLED: { title: "Order cancelled", body: "This order was cancelled." },
    REJECTED: { title: "Store could not take it", body: "The store could not take this order." },
    FAILED: { title: "Order failed", body: "This order did not go through." },
  },
  ar: {
    PLACED: { title: "تم إنشاء الطلب", body: "وصل طلبك إلى المتجر." },
    ACCEPTED: { title: "المتجر قبل الطلب", body: "قبل المتجر الطلب." },
    PREPARING: { title: "قيد التجهيز", body: "المتجر يجهّز الطلب." },
    READY_FOR_PICKUP: { title: "جاهز للاستلام", body: "بانتظار المندوب." },
    COURIER_ASSIGNED: { title: "تم تعيين مندوب", body: "المندوب في طريقه إلى المتجر." },
    PICKED_UP: { title: "تم الاستلام", body: "المندوب استلم الطلب." },
    OUT_FOR_DELIVERY: { title: "في الطريق", body: "الطلب في الطريق إليك." },
    DELIVERED: { title: "تم التوصيل", body: "وصل الطلب." },
    CANCELLED: { title: "تم إلغاء الطلب", body: "أُلغي هذا الطلب." },
    REJECTED: { title: "المتجر لم يقبل الطلب", body: "تعذّر على المتجر قبول الطلب." },
    FAILED: { title: "تعذّر الطلب", body: "لم يكتمل هذا الطلب." },
  },
};

export function alertCopy(locale: string, status: OrderStatus): { title: string; body: string } {
  const language: AppLocale = locale === "en" ? "en" : "ar";
  return COPY[language][status];
}
