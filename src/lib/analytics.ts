import type { AnalyticsName } from "@/lib/types";

const KEY = "needit.analytics";

export function track(
  name: AnalyticsName,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  const entry = { name, props: props ?? {}, at: new Date().toISOString() };
  try {
    const raw = localStorage.getItem(KEY);
    const list: unknown[] = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push(entry);
    localStorage.setItem(KEY, JSON.stringify(list.slice(-300)));
  } catch {
    // Analytics must never block the shopping flow.
  }
}
