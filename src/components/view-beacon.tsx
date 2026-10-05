"use client";

import { track } from "@/lib/analytics";
import type { AnalyticsName } from "@/lib/types";
import { useEffect } from "react";

export function ViewBeacon({
  event,
  id,
  count,
}: {
  event: AnalyticsName;
  id?: string;
  count?: number;
}) {
  useEffect(() => {
    const props: Record<string, string | number> = {};
    if (id) props.id = id;
    if (typeof count === "number") props.count = count;
    track(event, Object.keys(props).length > 0 ? props : undefined);
  }, [event, id, count]);

  return null;
}
