"use client";
import Reveal from "./Reveal";
import LocationMap from "./LocationMap";
import { RouteLine, Selo } from "./Decor";
import { VENUE } from "@/lib/config";
import { track } from "@/lib/tracking";

export default function Location() {
  return (
    <section className="section location-section" id="localizacao">
      {/* map-texture backdrop */}
      <div className="location-texture" aria-hidden />

      <Selo
        country="Brasil"
        size={92}
        className="wg-float location-selo"
        data-parallax="-26"
        aria-hidden
      />

      <div className="container location-layout">
        <Reveal className="location-info">
          <span className="eyebrow" style={{ color: "var(--purpura)" }}>
            Onde a nova fase acontece
          </span>
          <h2 className="h-emocional" style={{ margin: "16px 0 8px" }}>
            Encontre o Wine Garden.
          </h2>

          <div style={{ maxWidth: 320, margin: "18px 0 24px" }}>
            <RouteLine />
          </div>

          <address className="location-address">
            {VENUE.addressLines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>

          <p className="mono-label location-hours">{VENUE.hours}</p>

          <div className="location-actions">
            <a
              className="btn"
              href={VENUE.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("maps_click", { placement: "location" })}
            >
              📍 Abrir rota no Maps
            </a>
            <a
              className="btn btn--ghost"
              href={VENUE.reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("reservation_click", { placement: "location" })}
            >
              Reservar uma mesa
            </a>
          </div>
        </Reveal>

        <Reveal delay={120} className="location-map-wrap">
          <div className="ticket location-map-card">
            <div className="location-map-card__head">
              <span className="mono-label" style={{ color: "var(--uva-70)" }}>
                Brasília · DF
              </span>
              <span className="mono-label" style={{ color: "var(--granada)" }}>
                {VENUE.lat.toFixed(4)}, {VENUE.lng.toFixed(4)}
              </span>
            </div>
            <LocationMap />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
