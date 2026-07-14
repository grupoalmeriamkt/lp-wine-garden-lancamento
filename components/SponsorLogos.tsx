import { SPONSORS } from "@/lib/config";

export default function SponsorLogos({
  compact = false,
  showApoioLabel = false,
}: {
  compact?: boolean;
  showApoioLabel?: boolean;
}) {
  const scale = compact ? 0.78 : 1;

  return (
    <div className={`sponsor-logos${compact ? " sponsor-logos--compact" : ""}`}>
      <div className="sponsor-logos__caixa">
        <img
          src={SPONSORS.caixa.logo}
          alt={SPONSORS.caixa.name}
          height={Math.round(SPONSORS.caixa.height * scale)}
          className="sponsor-logos__logo sponsor-logos__logo--caixa"
          loading="lazy"
        />
      </div>
      {showApoioLabel && (
        <p className="mono-label sponsor-logos__support">Apoio</p>
      )}
      <div className="sponsor-logos__partners" aria-label="Apoio Visa e Elo">
        <img
          src={SPONSORS.visa.logo}
          alt={SPONSORS.visa.name}
          height={Math.round(SPONSORS.visa.height * scale)}
          className="sponsor-logos__logo sponsor-logos__logo--visa"
          loading="lazy"
        />
        <img
          src={SPONSORS.elo.logo}
          alt={SPONSORS.elo.name}
          height={Math.round(SPONSORS.elo.height * scale)}
          className="sponsor-logos__logo sponsor-logos__logo--elo"
          loading="lazy"
        />
      </div>
    </div>
  );
}
