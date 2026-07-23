import { SPONSORS } from "@/lib/config";

export default function SponsorLogos({ compact = false }: { compact?: boolean }) {
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
    </div>
  );
}
