import type { CategoryId } from "@/lib/types";

/** Photographs in /public/products. Wikimedia Commons and Flickr, CC0 or public domain. */
const PRODUCT_IMAGE: Record<string, string> = {
  "watar-usbc": "/products/usb-c-cable.jpg",
  "noor-usbc": "/products/usb-c-cable.jpg",
  "nakheel-usbc": "/products/usb-c-cable.jpg",
  "watar-charger": "/products/wall-charger.jpg",
  "noor-charger": "/products/wall-charger.jpg",
  "watar-adapter": "/products/adapter.jpg",
  "watar-headphones": "/products/earphones.jpg",
  "noor-mouse": "/products/mouse.jpg",
  "noor-car-charger": "/products/car-charger.jpg",
  "nakheel-notebook": "/products/notebook.jpg",
  "nakheel-batteries": "/products/batteries.jpg",
  "qalam-notebook": "/products/notebook.jpg",
  "qalam-pens": "/products/pens.jpg",
  "qalam-board": "/products/board.jpg",
  "qalam-markers": "/products/markers.jpg",
  "qalam-tape": "/products/tape.jpg",
  "qalam-scissors": "/products/scissors.jpg",
  "qalam-folder": "/products/folder.jpg",
  "bayt-organizer": "/products/drawer.jpg",
  "bayt-hooks": "/products/hooks.jpg",
  "bayt-tissues": "/products/tissues.jpg",
  "farah-balloons": "/products/balloons.jpg",
  "farah-plates": "/products/plates.jpg",
  "farah-bag": "/products/gift-bag.jpg",
  "farah-wrap": "/products/wrap.jpg",
  "sayyara-holder": "/products/holder.jpg",
  "sayyara-wipes": "/products/wipes.jpg",
  "rafiq-food": "/products/dog-food.jpg",
  "rafiq-leash": "/products/leash.jpg",
};

export const CATEGORY_IMAGE: Record<CategoryId, string> = {
  school: "/products/notebook.jpg",
  home: "/products/drawer.jpg",
  tech: "/products/usb-c-cable.jpg",
  car: "/products/car-charger.jpg",
  gifts: "/products/wrap.jpg",
  party: "/products/balloons.jpg",
  pets: "/products/leash.jpg",
  stationery: "/products/pens.jpg",
};

export function productImage(id: string): string {
  return PRODUCT_IMAGE[id] ?? "/mark.png";
}

export function categoryImage(id: CategoryId): string {
  return CATEGORY_IMAGE[id];
}

const PHOTO_CREDIT: Record<string, { en: string; ar: string }> = {
  "bayt-hooks": {
    en: "Photo: Richard Masoner / Cyclelicious, CC BY-SA",
    ar: "الصورة: Richard Masoner / Cyclelicious، CC BY-SA",
  },
  "sayyara-holder": {
    en: "Photo: tonyr30, CC BY",
    ar: "الصورة: tonyr30، CC BY",
  },
};

export function photoCredit(id: string, locale: "ar" | "en"): string | null {
  return PHOTO_CREDIT[id]?.[locale] ?? null;
}
