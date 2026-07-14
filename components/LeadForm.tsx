"use client";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { glassById, GlassId } from "@/lib/glasses";
import { isAdult, isValidPhone } from "@/lib/voucher";
import { captureUtms, getStoredUtms, track } from "@/lib/tracking";
import type { CreateVoucherResult } from "@/lib/types";

const VISIT_OPTIONS = [
  "Sim, já fui",
  "Ainda não fui",
  "Quero conhecer essa nova fase",
];

const SUBMIT_DELAY_MS = 4000;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function LeadForm({
  glass,
  onSubmitStart,
  onSuccess,
  onError,
}: {
  glass: GlassId;
  onSubmitStart: () => void;
  onSuccess: (r: CreateVoucherResult) => void;
  onError: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [email, setEmail] = useState("");
  const [visit, setVisit] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    captureUtms();
  }, []);

  const g = glassById(glass);

  function onFirstInteraction() {
    if (!started.current) {
      started.current = true;
      track("form_started", { glass });
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Informe seu nome completo.";
    if (!isValidPhone(phone)) e.phone = "Informe um telefone válido com DDD.";
    if (!birth) e.birth = "Informe sua data de nascimento.";
    else if (!isAdult(birth)) e.birth = "É necessário ter 18 anos ou mais.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;
    setLoading(true);
    onSubmitStart();
    track("form_submitted", { glass });

    const utms = getStoredUtms();
    const startedAt = Date.now();

    try {
      const res = await fetch("/api/voucher", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          birth_date: birth,
          email: email.trim() || null,
          has_visited_before: visit || null,
          selected_glass: glass,
          ...utms,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "phone_already_registered") {
          setServerError(
            "Este telefone já resgatou um convite. Uma cortesia por telefone."
          );
        } else if (data.error === "not_adult") {
          setServerError("Convite válido apenas para maiores de 18 anos.");
        } else {
          setServerError("Não foi possível gerar seu convite. Tente novamente.");
        }
        onError();
        return;
      }

      const remaining = SUBMIT_DELAY_MS - (Date.now() - startedAt);
      if (remaining > 0) await wait(remaining);

      track("voucher_created", { glass, code: data.voucher?.voucher_code });
      onSuccess(data as CreateVoucherResult);
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
      onError();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="section" id="cadastro" style={{ background: "var(--offwhite)" }}>
      <div className="container" style={{ maxWidth: 620 }}>
        <Reveal>
          <div className="center" style={{ marginBottom: 8 }}>
            <span className="eyebrow" style={{ color: "var(--purpura)" }}>
              Cadastro rápido
            </span>
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h2 className="h-emocional center" style={{ marginBottom: 10 }}>
            Gere seu convite individual.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <p className="body muted center" style={{ marginBottom: 12 }}>
            Taça escolhida:{" "}
            <strong style={{ color: "var(--granada)" }}>{g?.name}</strong>. Não pedimos
            CPF neste primeiro momento.
          </p>
        </Reveal>

        <Reveal delay={140}>
          <form
            onSubmit={submit}
            onChange={onFirstInteraction}
            className="ticket form-ticket"
            noValidate
          >
            <div className="field">
              <label htmlFor="name">Nome completo</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="field">
              <label htmlFor="phone">Telefone com WhatsApp</label>
              <input
                id="phone"
                inputMode="tel"
                placeholder="(61) 9 9999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>

            <div className="field">
              <label htmlFor="birth">Data de nascimento</label>
              <input
                id="birth"
                type="date"
                value={birth}
                onChange={(e) => setBirth(e.target.value)}
              />
              <span className="hint">Convite válido apenas para maiores de 18 anos.</span>
              {errors.birth && <span className="error">{errors.birth}</span>}
            </div>

            <div className="field">
              <label htmlFor="email">E-mail (opcional)</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label>Você já conhece o Wine Garden?</label>
              <div className="radio-group">
                {VISIT_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`radio-opt ${visit === opt ? "sel" : ""}`}
                  >
                    <input
                      type="radio"
                      name="visit"
                      value={opt}
                      checked={visit === opt}
                      onChange={() => setVisit(opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>

            {serverError && (
              <p className="error form-error">{serverError}</p>
            )}

            <button className="btn" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
              {loading ? "Gerando convite…" : "Gerar meu convite →"}
            </button>
            <p className="tiny muted center" style={{ marginTop: 16 }}>
              Ao continuar, você concorda em receber o convite e novidades do Wine
              Garden.
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
