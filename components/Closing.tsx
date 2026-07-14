"use client";
import Reveal from "./Reveal";
import { SeloStrip } from "./Decor";
import { track } from "@/lib/tracking";

export default function Closing({ onCta }: { onCta: () => void }) {
  return (
    <section className="section center" style={{ background: "var(--granada)", color: "var(--offwhite)", overflow: "hidden" }}>
      <div className="container" style={{ maxWidth: 820 }}>
        <Reveal>
          <SeloStrip opacity={0.55} />
        </Reveal>
        <Reveal delay={100}>
          <h2 className="display" style={{ color: "var(--offwhite)", margin: "40px 0 0" }}>
            Volte para brindar.
          </h2>
        </Reveal>
        <Reveal delay={160}>
          <p className="display italic" style={{ color: "var(--bege)", marginBottom: 8 }}>
            Fique para descobrir.
          </p>
        </Reveal>
        <Reveal delay={220}>
          <p className="body" style={{ color: "rgba(247,249,234,0.82)", maxWidth: 560, margin: "18px auto 0" }}>
            A nova fase do Wine Garden começa com uma taça, mas continua em cada
            escolha: mais de 40 rótulos, novas harmonizações, novas noites e novos
            encontros.
          </p>
        </Reveal>
        <Reveal delay={280}>
          <div style={{ marginTop: 40 }}>
            <button
              className="btn btn--light"
              onClick={() => {
                track("hero_cta_click", { placement: "closing" });
                onCta();
              }}
            >
              Escolher minha taça →
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
