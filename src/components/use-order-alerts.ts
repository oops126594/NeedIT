"use client";

import type { AppLocale } from "@/i18n/routing";
import type { AppNotification } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AlertPermission = NotificationPermission | "unsupported";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) output[index] = raw.charCodeAt(index);
  return output;
}

function mergeNotes(server: AppNotification[], local: AppNotification[]) {
  const ids = new Set(server.map((note) => note.id));
  return [...server, ...local.filter((note) => !ids.has(note.id))].sort((a, b) => b.createdAt - a.createdAt);
}

export function useOrderAlerts(local: AppNotification[], locale: AppLocale) {
  const [server, setServer] = useState<AppNotification[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<AlertPermission>("default");
  const [banner, setBanner] = useState<AppNotification | null>(null);
  const [pushReady, setPushReady] = useState<boolean | null>(null);
  const seen = useRef(new Set<string>());
  const primed = useRef(false);

  const pull = useCallback(async () => {
    const response = await fetch("/api/notifications");
    if (response.status === 401) {
      setSignedIn(false);
      setServer([]);
      return;
    }
    if (!response.ok) return;
    const data = (await response.json()) as { notifications: AppNotification[] };
    setSignedIn(true);
    if (primed.current) {
      const fresh = data.notifications.find((note) => !note.read && !seen.current.has(note.id));
      if (fresh) setBanner(fresh);
    }
    for (const note of data.notifications) seen.current.add(note.id);
    primed.current = true;
    setServer(data.notifications);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    void pull();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void pull();
    }, 5000);
    return () => window.clearInterval(timer);
  }, [pull]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    function onMessage(event: MessageEvent) {
      if (event.data?.type === "needit-order") void pull();
    }
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [pull]);

  const subscribe = useCallback(async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
      const registration = await navigator.serviceWorker.register("/sw.js");
      const keyResponse = await fetch("/api/push/key");
      if (!keyResponse.ok) return false;
      const { publicKey } = (await keyResponse.json()) as { publicKey: string };
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return false;
      const saved = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          locale,
        }),
      });
      return saved.ok;
    } catch {
      return false;
    }
  }, [locale]);

  useEffect(() => {
    if (!signedIn || permission !== "granted") return;
    void subscribe().then((ok) => setPushReady(ok));
  }, [permission, signedIn, subscribe]);

  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 8000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  const enable = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const next = await Notification.requestPermission();
    setPermission(next);
    if (next === "granted") setPushReady(await subscribe());
  }, [subscribe]);

  const markRead = useCallback(() => {
    setServer((current) => current.map((note) => ({ ...note, read: true })));
    void fetch("/api/notifications", { method: "POST" });
  }, []);

  const notes = useMemo(() => mergeNotes(server, local), [local, server]);
  const unread = notes.filter((note) => !note.read).length;

  return {
    notes,
    unread,
    signedIn,
    permission,
    pushReady,
    banner,
    dismiss: () => setBanner(null),
    enable,
    markRead,
  };
}
