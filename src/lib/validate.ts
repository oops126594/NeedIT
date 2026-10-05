export function isSaudiMobile(input: string): boolean {
  const compact = input.replace(/[\s-]/g, "");
  return /^(?:\+966|00966|0)?5\d{8}$/.test(compact);
}

export type CardField = "number" | "expiry" | "cvc";

/** Demo check only. Callers must keep the full number in memory and store last4. */
export function cardFieldError(number: string, expiry: string, cvc: string): CardField | null {
  const digits = number.replace(/\s/g, "");
  if (!/^\d{16}$/.test(digits)) return "number";

  const match = expiry.trim().match(/^(\d{2})\s*\/\s*(\d{2})$/);
  if (!match) return "expiry";
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return "expiry";
  if (new Date() >= new Date(year, month, 1)) return "expiry";

  if (!/^\d{3}$/.test(cvc.trim())) return "cvc";
  return null;
}

export function cardLast4(number: string): string {
  return number.replace(/\s/g, "").slice(-4);
}
