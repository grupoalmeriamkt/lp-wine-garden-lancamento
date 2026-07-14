import Reveal from "./Reveal";
import { Selo, Mapa, Taca, RouteLine } from "./Decor";

export default function Concept() {
  return (
    <section className="section concept-section">
      <div className="container" style={{ position: "relative" }}>
        <div className="concept-grid">
          <div>
            <Reveal>
              <div
                className="eyebrow"
                style={{ color: "var(--bege)", marginBottom: 24 }}
              >
                Uma nova fase
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h2
                className="h-emocional"
                style={{ color: "var(--offwhite)", maxWidth: 620 }}
              >
                Uma nova fase para quem já viveu muitas histórias aqui.
              </h2>
            </Reveal>
            <Reveal delay={140}>
              <div style={{ maxWidth: 380, margin: "30px 0" }}>
                <RouteLine />
              </div>
            </Reveal>
            <Reveal delay={200}>
              <p
                className="body"
                style={{ color: "rgba(247,249,234,0.82)", maxWidth: 540 }}
              >
                Depois de sete anos de encontros, brindes e memórias, o Wine Garden
                volta ao seu nome original com um novo conceito: vinhos em taça,
                mais de 40 rótulos na carta, gastronomia, música e uma atmosfera
                pensada para redescobrir o prazer de estar junto.
              </p>
            </Reveal>
          </div>

          <Reveal delay={160} className="concept-visual">
            <div className="concept-stage">
              <Mapa
                country="Franca"
                width={230}
                className="concept-map"
                data-parallax="-14"
              />
              <Selo
                country="Portugal"
                size={110}
                className="wg-float concept-selo--pt"
                data-parallax="-30"
              />
              <Selo
                country="Argentina"
                size={96}
                className="wg-float concept-selo--ar"
                data-parallax="34"
              />
              <Taca
                src="/brand/elementos/taca-purpura.svg"
                size={150}
                className="wg-float concept-taca"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
