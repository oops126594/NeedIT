"use client";

import type { LatLng } from "@/lib/geo";

type Pin = { point: LatLng; label: string; kind: "store" | "drop" | "courier" };

function layout(pins: Pin[]) {
  const lats = pins.map((pin) => pin.point.lat);
  const lngs = pins.map((pin) => pin.point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = Math.max(maxLat - minLat, 0.01);
  const lngSpan = Math.max(maxLng - minLng, 0.01);
  return pins.map((pin) => ({
    ...pin,
    x: 28 + ((pin.point.lng - minLng) / lngSpan) * 264,
    y: 168 - ((pin.point.lat - minLat) / latSpan) * 136,
  }));
}

export function TrackMap({
  store,
  drop,
  courier,
  storeLabel,
  dropLabel,
  courierLabel,
}: {
  store: LatLng;
  drop: LatLng;
  courier?: LatLng | null;
  storeLabel: string;
  dropLabel: string;
  courierLabel: string;
}) {
  const pins = layout([
    { point: store, label: storeLabel, kind: "store" },
    { point: drop, label: dropLabel, kind: "drop" },
    ...(courier ? [{ point: courier, label: courierLabel, kind: "courier" as const }] : []),
  ]);
  const storePin = pins.find((pin) => pin.kind === "store");
  const dropPin = pins.find((pin) => pin.kind === "drop");
  const courierPin = pins.find((pin) => pin.kind === "courier");
  const route = courierPin && dropPin ? `M ${courierPin.x} ${courierPin.y} L ${dropPin.x} ${dropPin.y}` : "";
  const leg = storePin && dropPin ? `M ${storePin.x} ${storePin.y} L ${dropPin.x} ${dropPin.y}` : "";

  return (
    <svg viewBox="0 0 320 200" role="img" className="h-52 w-full rounded-2xl bg-[#e7eef2]">
      <path d="M0 40 H320 M0 90 H320 M0 140 H320 M40 0 V200 M110 0 V200 M180 0 V200 M250 0 V200" stroke="#d5e0e6" strokeWidth="8" />
      {leg ? <path d={leg} fill="none" stroke="#9aa8b2" strokeWidth="3" strokeDasharray="1 0" /> : null}
      {route ? <path d={route} fill="none" stroke="#178a3d" strokeWidth="4" strokeLinecap="round" /> : null}
      {pins.map((pin) => (
        <g key={pin.kind}>
          <circle
            cx={pin.x}
            cy={pin.y}
            r={pin.kind === "courier" ? 9 : 7}
            fill={pin.kind === "courier" ? "#178a3d" : pin.kind === "drop" ? "#1c1c1c" : "#ffffff"}
            stroke={pin.kind === "store" ? "#1c1c1c" : "#ffffff"}
            strokeWidth="2"
          />
          <text x={pin.x} y={pin.y - 14} textAnchor="middle" fontSize="11" fill="#1c1c1c">
            {pin.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
