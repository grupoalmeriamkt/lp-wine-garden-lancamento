import Reveal from "./Reveal";
import { RouteLine, Taca } from "./Decor";
import { SPONSORS } from "@/lib/config";

export default function Sponsors() {
  return (
    <section className="section sponsors-section">
      <Taca
        src="/brand/elementos/taca-purpura.svg"
        size={120}
        className="sponsors-taca wg-float"
        data-parallax="-20"
        aria-hidden
      />

      <div className="container sponsors-layout">
        <Reveal>
          <div className="sponsors-story">
            <span className="eyebrow sponsors-eyebrow">Quem viabiliza este convite</span>

            <h2 className="h-emocional sponsors-title">
              Três marcas,
              <br />
              <span className="italic">um mesmo brinde.</span>
            </h2>

            <div className="sponsors-divider">
              <RouteLine />
            </div>

            <p className="body sponsors-copy">
              A primeira taça da nova fase é um convite especial oferecido por Cartões
              Caixa, Visa e Elo. Clientes Caixa com cartões Visa ou Elo também contam
              com benefícios exclusivos no Wine Garden.
            </p>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="sponsors-ticket stamp-border" aria-label="Patrocinadores">
            <p className="mono-label sponsors-ticket__label">Oferecimento</p>

            <div className="sponsors-brands">
              {SPONSORS.map((sponsor, index) => (
                <div key={sponsor.name} className="sponsor-brand">
                  <img
                    src={sponsor.logo}
                    alt={sponsor.name}
                    height={sponsor.height}
                    style={{ height: sponsor.height }}
                    className="sponsor-brand__logo"
                    loading="lazy"
                  />
                  {index < SPONSORS.length - 1 && (
                    <hr className="dotted sponsor-brand__sep" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
