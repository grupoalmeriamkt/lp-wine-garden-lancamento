"use client";

export type TrackEvent =
  | "lp_view"
  | "hero_cta_click"
  | "glass_selected"
  | "form_started"
  | "form_submitted"
  | "voucher_created"
  | "maps_click"
  | "whatsapp_click"
  | "reservation_click"
  | "voucher_redeemed";

export interface Utm {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  source?: string;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

const STORAGE_KEY = "wg_utm";

/** Reads UTMs from the URL, persists them, and returns the merged set. */
export function captureUtms(): Utm {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const fromUrl: Utm = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) fromUrl[k] = v;
  });
  if (document.referrer) fromUrl.source = document.referrer;
  else fromUrl.source = fromUrl.source ?? "direct";

  const stored = getStoredUtms();
  // URL wins over stored; keep first-touch source if already present
  const merged: Utm = { ...stored, ...fromUrl };
  if (stored.source && stored.source !== "direct") merged.source = stored.source;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
  return merged;
}

export function getStoredUtms(): Utm {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Utm) : {};
  } catch {
    return {};
  }
}

/** Fires a tracking event to dataLayer (if any) and the server endpoint. */
export function track(event: TrackEvent, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const data = { ...payload, ...getStoredUtms(), ts: new Date().toISOString() };

  // GTM / GA4 dataLayer
  const w = window as unknown as { dataLayer?: unknown[] };
  if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event, ...data });
  }

  // server log / CRM forwarding
  try {
    navigator.sendBeacon?.(
      "/api/track",
      new Blob([JSON.stringify({ event, payload: data })], {
        type: "application/json",
      })
    );
  } catch {
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ event, payload: data }),
      keepalive: true,
    }).catch(() => {});
  }
}
