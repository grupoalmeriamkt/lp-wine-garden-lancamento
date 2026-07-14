"use client";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { glassById, GlassId } from "@/lib/glasses";
import {
  formatBrBirthInput,
  formatCpf,
  isAdult,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  parseBrBirthdate,
} from "@/lib/voucher";
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

function isCreateVoucherResult(data: unknown): data is CreateVoucherResult {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<CreateVoucherResult>;
  return Boolean(d.voucher?.voucher_code && d.lead?.name && d.qrDataUrl);
}

function errorMessageFromCode(code: string): string {
  switch (code) {
    case "phone_already_registered":
      return "Este telefone já resgatou um convite. Uma cortesia por telefone.";
    case "not_adult":
      return "Convite válido apenas para maiores de 18 anos.";
    case "invalid_name":
      return "Informe seu nome completo.";
    case "invalid_phone":
      return "Informe um telefone válido com DDD.";
    case "invalid_email":
      return "Informe um e-mail válido.";
    case "invalid_cpf":
      return "Informe um CPF válido.";
    case "cpf_already_registered":
      return "Este CPF já resgatou um convite. Uma cortesia por pessoa.";
    case "invalid_glass":
      return "Selecione uma taça antes de continuar.";
    case "qr_failed":
    case "persist_failed":
      return "Não foi possível gerar seu convite agora. Tente novamente em instantes.";
    default:
      return "Não foi possível gerar seu convite. Tente novamente.";
  }
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
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [birth, setBirth] = useState("");
  const [birthDisplay, setBirthDisplay] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [email, setEmail] = useState("");
  const [visit, setVisit] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    captureUtms();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 820px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
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
    if (!isValidEmail(email)) e.email = "Informe um e-mail válido.";
    if (!isValidCpf(cpf)) e.cpf = "Informe um CPF válido.";
    if (!birth) {
      e.birth =
        isMobile && birthDisplay.replace(/\D/g, "").length > 0
          ? "Informe uma data válida (DD/MM/AAAA)."
          : "Informe sua data de nascimento.";
    } else if (!isAdult(birth)) e.birth = "É necessário ter 18 anos ou mais.";
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
          cpf,
          birth_date: birth,
          email: email.trim(),
          has_visited_before: visit || null,
          selected_glass: glass,
          ...utms,
        }),
      });

      let data: Record<string, unknown> = {};
      try {
        data = (await res.json()) as Record<string, unknown>;
      } catch {
        const message = "Resposta inválida do servidor. Tente novamente.";
        setServerError(message);
        onError(message);
        return;
      }

      if (!res.ok) {
        const code = typeof data.error === "string" ? data.error : "unknown";
        const message = errorMessageFromCode(code);
        setServerError(message);
        onError(message);
        return;
      }

      if (!isCreateVoucherResult(data)) {
        const message = "Não foi possível montar seu convite. Tente novamente.";
        setServerError(message);
        onError(message);
        return;
      }

      const remaining = SUBMIT_DELAY_MS - (Date.now() - startedAt);
      if (remaining > 0) await wait(remaining);

      track("voucher_created", { glass, code: data.voucher.voucher_code });
      onSuccess(data);
    } catch {
      const message = "Erro de conexão. Verifique sua internet e tente novamente.";
      setServerError(message);
      onError(message);
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
            <strong style={{ color: "var(--granada)" }}>{g?.name}</strong>. Leva menos de
            um minuto.
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
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                autoComplete="off"
              />
              {errors.cpf && <span className="error">{errors.cpf}</span>}
            </div>

            <div className="field">
              <label htmlFor="birth">Data de nascimento</label>
              {isMobile ? (
                <input
                  id="birth"
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday"
                  placeholder="DD/MM/AAAA"
                  value={birthDisplay}
                  onChange={(e) => {
                    const formatted = formatBrBirthInput(e.target.value);
                    setBirthDisplay(formatted);
                    setBirth(parseBrBirthdate(formatted) ?? "");
                  }}
                />
              ) : (
                <input
                  id="birth"
                  type="date"
                  value={birth}
                  onChange={(e) => setBirth(e.target.value)}
                />
              )}
              <span className="hint">
                {isMobile
                  ? "Digite no formato DD/MM/AAAA. Convite válido apenas para maiores de 18 anos."
                  : "Convite válido apenas para maiores de 18 anos."}
              </span>
              {errors.birth && <span className="error">{errors.birth}</span>}
            </div>

            <div className="field">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <span className="hint">Enviaremos seu convite também por e-mail.</span>
              {errors.email && <span className="error">{errors.email}</span>}
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
