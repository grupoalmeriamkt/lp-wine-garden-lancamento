import Reveal from "./Reveal";

const STEPS = [
  { n: "01", t: "Escolha sua taça", d: "Espumante, branco ou rosé, ou tinto." },
  { n: "02", t: "Gere seu convite", d: "Um cadastro rápido e o convite é seu." },
  { n: "03", t: "Apresente no Wine Garden", d: "Mostre o QR Code na entrada da casa." },
  { n: "04", t: "Brinde a nova fase", d: "A primeira taça é por nossa conta." },
];

export default function HowItWorks() {
  return (
    <section className="section" style={{ background: "var(--bege)" }}>
      <div className="container">
        <Reveal>
          <div className="center" style={{ marginBottom: 12 }}>
            <span className="eyebrow" style={{ color: "var(--granada)" }}>
              Como funciona
            </span>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="h-emocional center" style={{ color: "var(--uva)", marginBottom: 52 }}>
            Um convite em quatro passos.
          </h2>
        </Reveal>

        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="ticket step-card">
                <div className="step-card__n">{s.n}</div>
                <hr className="dotted" style={{ margin: "16px 0" }} />
                <h3 className="step-card__title">{s.t}</h3>
                <p className="body step-card__desc">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
