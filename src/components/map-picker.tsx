"use client";

import { SERVICE_LOCATIONS, type MapPlace } from "@/lib/locations";
import { textOf } from "@/lib/text";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type LatLng = { lat: number; lng: number };

type GoogleLatLng = { lat: () => number; lng: () => number };

type GoogleMap = {
  setCenter: (position: LatLng) => void;
  panTo: (position: LatLng) => void;
  addListener: (event: "click", handler: (event: { latLng: GoogleLatLng | null }) => void) => void;
};

type GoogleMarker = {
  setPosition: (position: LatLng) => void;
  getPosition: () => GoogleLatLng | null;
  addListener: (event: "dragend", handler: () => void) => void;
};

type AddressComponent = { long_name: string; types: string[] };

type GeocoderResult = {
  formatted_address: string;
  address_components: AddressComponent[];
  geometry?: { location: GoogleLatLng };
};

type GoogleGeocoder = {
  geocode: (
    request: { location?: LatLng; address?: string },
    callback: (results: GeocoderResult[] | null, status: string) => void,
  ) => void;
};

type GoogleMaps = {
  Map: new (element: HTMLElement, options: object) => GoogleMap;
  Marker: new (options: object) => GoogleMarker;
  Geocoder: new () => GoogleGeocoder;
};

declare global {
  interface Window {
    google?: { maps: GoogleMaps };
  }
}

const SCRIPT_ID = "needit-google-maps";
let loader: Promise<void> | null = null;

function loadMaps(key: string, language: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&language=${language}`;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error("maps"));
    };
    document.head.appendChild(script);
  });
  return loader;
}

function toPlace(result: GeocoderResult, position: LatLng): MapPlace {
  const district =
    result.address_components.find((part) =>
      part.types.some((type) => type === "sublocality" || type === "sublocality_level_1" || type === "locality"),
    )?.long_name ?? result.formatted_address.split(",")[0]?.trim() ?? result.formatted_address;
  return { ...position, label: result.formatted_address, district };
}

export function MapPicker({
  initial,
  onChoose,
}: {
  initial: LatLng;
  onChoose: (place: MapPlace) => void;
}) {
  const t = useTranslations("Home");
  const locale = useAppLocale();
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const canvas = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const geocoderRef = useRef<GoogleGeocoder | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<MapPlace | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "failed">(key ? "loading" : "missing");
  const [notice, setNotice] = useState<string | null>(null);

  const startLat = initial.lat;
  const startLng = initial.lng;

  useEffect(() => {
    if (!key || !canvas.current || mapRef.current) return;
    let alive = true;
    void loadMaps(key, locale === "ar" ? "ar" : "en")
      .then(() => {
        if (!alive || !canvas.current || !window.google) return;
        const maps = window.google.maps;
        const map = new maps.Map(canvas.current, {
          center: { lat: startLat, lng: startLng },
          zoom: 14,
          clickableIcons: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        const marker = new maps.Marker({ position: { lat: startLat, lng: startLng }, map, draggable: true });
        const geocoder = new maps.Geocoder();
        mapRef.current = map;
        markerRef.current = marker;
        geocoderRef.current = geocoder;

        const resolve = (position: LatLng) => {
          geocoder.geocode({ location: position }, (results, code) => {
            if (!alive) return;
            const result = code === "OK" ? results?.[0] : undefined;
            setDraft(
              result
                ? toPlace(result, position)
                : { ...position, label: `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`, district: "" },
            );
          });
        };

        map.addListener("click", (event) => {
          if (!event.latLng) return;
          const position = { lat: event.latLng.lat(), lng: event.latLng.lng() };
          marker.setPosition(position);
          resolve(position);
        });
        marker.addListener("dragend", () => {
          const point = marker.getPosition();
          if (!point) return;
          resolve({ lat: point.lat(), lng: point.lng() });
        });
        resolve({ lat: startLat, lng: startLng });
        setStatus("ready");
      })
      .catch(() => {
        if (alive) setStatus("failed");
      });
    return () => {
      alive = false;
    };
  }, [key, locale, startLat, startLng]);

  function moveTo(position: LatLng) {
    mapRef.current?.setCenter(position);
    mapRef.current?.panTo(position);
    markerRef.current?.setPosition(position);
    geocoderRef.current?.geocode({ location: position }, (results, code) => {
      const result = code === "OK" ? results?.[0] : undefined;
      setDraft(
        result
          ? toPlace(result, position)
          : { ...position, label: `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`, district: "" },
      );
    });
  }

  function search() {
    const address = query.trim();
    if (!address || !geocoderRef.current) return;
    setNotice(null);
    geocoderRef.current.geocode({ address }, (results, code) => {
      const found = results?.[0];
      if (code !== "OK" || !found?.geometry) {
        setNotice(t("mapNotFound"));
        return;
      }
      const position = { lat: found.geometry.location.lat(), lng: found.geometry.location.lng() };
      mapRef.current?.setCenter(position);
      markerRef.current?.setPosition(position);
      setDraft(toPlace(found, position));
    });
  }

  function locate() {
    if (!navigator.geolocation) {
      setNotice(t("mapDenied"));
      return;
    }
    setNotice(t("mapLocating"));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNotice(null);
        moveTo({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => setNotice(t("mapDenied")),
    );
  }

  if (!key) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">{t("mapMissingKey")}</p>
        {SERVICE_LOCATIONS.map((location) => (
          <button
            key={location.id}
            type="button"
            className="min-h-12 rounded-2xl border border-line px-4 text-start text-sm font-semibold"
            onClick={() =>
              onChoose({
                lat: location.lat,
                lng: location.lng,
                label: textOf(location.name, locale),
                district: textOf(location.district, locale),
              })
            }
          >
            {textOf(location.name, locale)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("mapSearch")}
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-paper px-3 text-sm"
        />
        <button type="submit" className="h-11 rounded-xl bg-accent px-3 text-sm font-semibold text-white">
          {t("mapFind")}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {SERVICE_LOCATIONS.map((location) => (
          <button
            key={location.id}
            type="button"
            className="h-9 rounded-full border border-line px-3 text-xs font-semibold"
            onClick={() => moveTo({ lat: location.lat, lng: location.lng })}
          >
            {textOf(location.name, locale)}
          </button>
        ))}
        <button type="button" className="h-9 rounded-full border border-line px-3 text-xs font-semibold" onClick={locate}>
          {t("mapMine")}
        </button>
      </div>
      <div ref={canvas} className="h-72 w-full overflow-hidden rounded-2xl bg-paper" />
      {status === "loading" ? <p className="text-sm text-muted">{t("mapLoading")}</p> : null}
      {status === "failed" ? <p className="text-sm text-danger">{t("mapFailed")}</p> : null}
      {notice ? <p className="text-sm text-muted">{notice}</p> : null}
      {draft ? <p className="text-sm">{draft.label}</p> : null}
      <button
        type="button"
        className="h-11 rounded-xl bg-accent text-sm font-semibold text-white disabled:opacity-50"
        disabled={!draft}
        onClick={() => {
          if (draft) onChoose(draft);
        }}
      >
        {t("mapUse")}
      </button>
    </div>
  );
}
