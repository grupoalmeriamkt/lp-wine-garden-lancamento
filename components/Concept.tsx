import Reveal from "./Reveal";
import { Selo, Mapa, Taca, RouteLine } from "./Decor";

export default function Concept() {
  return (
    <section
      className="section"
      style={{ background: "var(--uva)", color: "var(--offwhite)", overflow: "hidden" }}
    >
      <div className="container" style={{ position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 56,
            alignItems: "center",
          }}
          className="concept-grid"
        >
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
            <div
              style={{
                position: "relative",
                minHeight: 340,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Mapa
                country="Franca"
                width={230}
                data-parallax="-14"
                style={{ opacity: 0.6, filter: "brightness(0) invert(1)" }}
              />
              <Selo
                country="Portugal"
                size={110}
                className="wg-float"
                data-parallax="-30"
                style={{ position: "absolute", top: 0, right: 20 }}
              />
              <Selo
                country="Argentina"
                size={96}
                className="wg-float"
                data-parallax="34"
                style={{ position: "absolute", bottom: 10, left: 10 }}
              />
              <Taca
                src="/brand/elementos/taca-purpura.svg"
                size={150}
                className="wg-float"
                style={{ position: "absolute", bottom: -10, right: 40, filter: "brightness(0) invert(1)", opacity: 0.9 }}
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
