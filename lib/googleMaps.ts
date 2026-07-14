"use client";

/**
 * Minimal, dependency-free loader for the Google Maps JS API.
 * Loads the script once and resolves when `window.google.maps` is ready.
 */
let promise: Promise<typeof google> | null = null;

export function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window === "undefined") return Promise.reject("no window");
  if ((window as unknown as { google?: typeof google }).google?.maps) {
    return Promise.resolve((window as unknown as { google: typeof google }).google);
  }
  if (promise) return promise;

  promise = new Promise((resolve, reject) => {
    const cbName = "__wgMapsReady";
    (window as unknown as Record<string, unknown>)[cbName] = () => {
      resolve((window as unknown as { google: typeof google }).google);
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=${cbName}&loading=async`;
    s.async = true;
    s.defer = true;
    s.onerror = () => reject(new Error("failed to load google maps"));
    document.head.appendChild(s);
  });
  return promise;
}

/** Wine Garden brand-tinted raster map style (offwhite base, wine accents). */
export const WG_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#efe9d8" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5b0718" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f7f9ea" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c7ae9a" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e2d3c5" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#891a3d" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d5d3b4" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#414417" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#f7f3e7" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a6f5c" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#eaddcb" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dcc7ab" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#c7ae9a" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#a9becb" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#5b0718" }] },
];
