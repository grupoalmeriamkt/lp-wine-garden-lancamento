import { SPONSORS } from "@/lib/config";

export default function SponsorLogos({
  compact = false,
  showApoioLabel = false,
}: {
  compact?: boolean;
  showApoioLabel?: boolean;
}) {
  const caixaHeight = compact ? 24 : SPONSORS.caixa.height;
  const partnerHeight = compact ? 22 : SPONSORS.visa.height;

  return (
    <div className={`sponsor-logos${compact ? " sponsor-logos--compact" : ""}`}>
      <div className="sponsor-logos__caixa">
        <img
          src={SPONSORS.caixa.logo}
          alt={SPONSORS.caixa.name}
          height={caixaHeight}
          style={{ height: caixaHeight }}
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
          height={partnerHeight}
          style={{ height: partnerHeight }}
          className="sponsor-logos__logo"
          loading="lazy"
        />
        <img
          src={SPONSORS.elo.logo}
          alt={SPONSORS.elo.name}
          height={partnerHeight + 4}
          style={{ height: partnerHeight + 4 }}
          className="sponsor-logos__logo"
          loading="lazy"
        />
      </div>
    </div>
  );
}
