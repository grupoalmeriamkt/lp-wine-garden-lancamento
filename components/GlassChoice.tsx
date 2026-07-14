"use client";
import Reveal from "./Reveal";
import { RouteLine, Selo } from "./Decor";
import { GLASSES, GlassId } from "@/lib/glasses";
import { track } from "@/lib/tracking";

export default function GlassChoice({
  selected,
  onSelect,
  onConfirm,
}: {
  selected: GlassId | null;
  onSelect: (id: GlassId) => void;
  onConfirm: () => void;
}) {
  return (
    <section className="section" id="escolha">
      <div className="container center">
        <Reveal>
          <div className="eyebrow" style={{ color: "var(--purpura)", marginBottom: 22 }}>
            O coração da nova fase
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 className="h-emocional" style={{ maxWidth: 700, margin: "0 auto" }}>
            Escolha a sua primeira taça da nova fase.
          </h2>
        </Reveal>
        <Reveal delay={140}>
          <p className="body muted" style={{ maxWidth: 540, margin: "20px auto 0" }}>
            Mais de 40 rótulos na carta. Selecione uma das opções disponíveis e gere
            seu convite individual para brindar o retorno do Wine Garden.
          </p>
        </Reveal>

        <div className="glass-grid" style={{ marginTop: 56 }}>
          {GLASSES.map((g, i) => {
            const isSel = selected === g.id;
            return (
              <Reveal key={g.id} delay={i * 90}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(g.id);
                    track("glass_selected", { glass: g.id });
                  }}
                  className="glass-card"
                  data-selected={isSel}
                  aria-pressed={isSel}
                >
                  <div className="glass-card__top">
                    <span className="mono-label" style={{ color: "var(--uva-70)" }}>
                      Nº {String(i + 1).padStart(2, "0")}
                    </span>
                    <Selo country={g.seloCountry} size={46} />
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.taca}
                    alt=""
                    aria-hidden
                    style={{ height: 108, margin: "10px auto 18px", display: "block" }}
                  />

                  <hr className="dotted" style={{ margin: "0 0 18px" }} />

                  <h3 style={{ fontSize: "2rem", color: "var(--uva)" }}>{g.name}</h3>
                  <p className="body muted" style={{ marginTop: 6, fontSize: "0.92rem" }}>
                    {g.tagline}
                  </p>

                  <span className="glass-card__check" aria-hidden>
                    {isSel ? "✓ Selecionada" : "Selecionar"}
                  </span>
                </button>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <div style={{ maxWidth: 420, margin: "50px auto 0" }}>
            <RouteLine />
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div style={{ marginTop: 34 }}>
            <button className="btn" disabled={!selected} onClick={onConfirm}>
              Gerar meu convite →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
