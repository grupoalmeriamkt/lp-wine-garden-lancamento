import Reveal from "./Reveal";

const RULES = [
  "Convite individual e intransferível.",
  "Uma cortesia por telefone cadastrado.",
  "Válido somente para maiores de 18 anos.",
  "Rótulos sujeitos à disponibilidade.",
  "Válido por tempo limitado.",
  "Não cumulativo com outras cortesias.",
  "Resgate presencial no Wine Garden.",
];

export default function Rules() {
  return (
    <section className="section" style={{ background: "var(--uva)", color: "var(--offwhite)" }}>
      <div className="container">
        <Reveal>
          <span className="eyebrow" style={{ color: "var(--bege)" }}>
            Regras da cortesia
          </span>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="h-emocional" style={{ color: "var(--offwhite)", margin: "16px 0 40px", maxWidth: 560 }}>
            O que você precisa saber.
          </h2>
        </Reveal>
        <div className="rules-grid">
          {RULES.map((r, i) => (
            <Reveal key={r} delay={i * 50}>
              <div className="rule-item">
                <span className="rule-num">{String(i + 1).padStart(2, "0")}</span>
                <p className="body" style={{ color: "rgba(247,249,234,0.85)", fontSize: "0.92rem" }}>
                  {r}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
