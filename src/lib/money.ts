export const HALALAS_PER_SAR = 100;

/** Flat prototype delivery fee. 800 halalas = 8.00 SAR. */
export const DELIVERY_FEE_HALALAS = 800;

export function formatSar(halalas: number, locale: "ar" | "en"): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(halalas / HALALAS_PER_SAR);
}

export function lineTotal(priceHalalas: number, quantity: number): number {
  return priceHalalas * quantity;
}
