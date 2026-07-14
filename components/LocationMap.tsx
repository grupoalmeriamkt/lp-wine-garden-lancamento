"use client";
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps, WG_MAP_STYLE } from "@/lib/googleMaps";
import { VENUE } from "@/lib/config";

export default function LocationMap() {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key || !mapEl.current) {
      setErr(true);
      return;
    }

    let cancelled = false;
    loadGoogleMaps(key)
      .then((google) => {
        if (cancelled || !mapEl.current) return;
        const center = { lat: VENUE.lat, lng: VENUE.lng };
        const map = new google.maps.Map(mapEl.current, {
          center,
          zoom: 15,
          styles: WG_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          backgroundColor: "#efe9d8",
        });

        // Brand-colored teardrop marker (SVG path).
        new google.maps.Marker({
          position: center,
          map,
          title: VENUE.name,
          icon: {
            path: "M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z",
            fillColor: "#5b0718",
            fillOpacity: 1,
            strokeColor: "#f7f9ea",
            strokeWeight: 2,
            scale: 1.4,
            anchor: new google.maps.Point(12, 36),
            labelOrigin: new google.maps.Point(12, 12),
          },
          label: { text: "🍷", fontSize: "14px" },
        });
      })
      .catch(() => !cancelled && setErr(true));

    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <a
        className="location-map location-map--fallback"
        href={VENUE.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="mono-label">Ver no Google Maps →</span>
      </a>
    );
  }

  return <div ref={mapEl} className="location-map" aria-label={`Mapa — ${VENUE.name}`} />;
}
