"use client";
import { use, useEffect, useState } from "react";
import { glassLabel } from "@/lib/glasses";
import type { Voucher } from "@/lib/types";
import SponsorLogos from "@/components/SponsorLogos";

type State =
  | { s: "loading" }
  | { s: "error"; msg: string }
  | { s: "ok"; voucher: Voucher };

export default function ValidarPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [state, setState] = useState<State>({ s: "loading" });

  async function load() {
    setState({ s: "loading" });
    const res = await fetch(`/api/voucher/${code}`);
    if (!res.ok) {
      setState({ s: "error", msg: "Convite não encontrado." });
      return;
    }
    const data = await res.json();
    setState({ s: "ok", voucher: data.voucher });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const statusColor: Record<string, string> = {
    active: "var(--oliva)",
    redeemed: "var(--uva-70)",
    expired: "var(--purpura)",
    cancelled: "var(--purpura)",
  };
  const statusLabel: Record<string, string> = {
    active: "Ativo — pode ser resgatado",
    redeemed: "Já resgatado",
    expired: "Expirado",
    cancelled: "Cancelado",
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--uva)" }}>
      <div className="ticket" style={{ maxWidth: 440, width: "100%", padding: 30, background: "var(--offwhite)" }}>
        <span className="eyebrow" style={{ color: "var(--purpura)" }}>Validação — equipe Wine Garden</span>
        <h1 style={{ fontSize: "2rem", marginTop: 10, color: "var(--uva)" }}>Convite {code}</h1>

        {state.s === "loading" && <p className="body muted" style={{ marginTop: 20 }}>Consultando…</p>}
        {state.s === "error" && <p className="error" style={{ marginTop: 20 }}>{state.msg}</p>}

        {state.s === "ok" && (
          <>
            <hr className="dotted" style={{ margin: "20px 0" }} />
            <p className="mono-label" style={{ color: "var(--uva-70)" }}>Taça</p>
            <p className="body" style={{ marginBottom: 14 }}>{glassLabel(state.voucher.selected_glass)}</p>
            <p className="mono-label" style={{ color: "var(--uva-70)" }}>Validade</p>
            <p className="body" style={{ marginBottom: 14 }}>
              {new Date(state.voucher.expires_at).toLocaleDateString("pt-BR")}
            </p>
            <p className="mono-label" style={{ color: "var(--uva-70)" }}>Status</p>
            <p className="body" style={{ color: statusColor[state.voucher.status], fontWeight: 500 }}>
              {statusLabel[state.voucher.status]}
            </p>

            {state.voucher.status === "active" && (
              <p className="body muted" style={{ marginTop: 24, fontSize: "0.9rem" }}>
                Apresente este convite à equipe Wine Garden na entrada. O resgate
                é feito pela equipe no momento da chegada.
              </p>
            )}
          </>
        )}

        <hr className="dotted" style={{ margin: "24px 0 18px" }} />
        <p className="mono-label" style={{ color: "var(--uva-70)", textAlign: "center", marginBottom: 12 }}>
          Oferecimento
        </p>
        <SponsorLogos showApoioLabel />
      </div>
    </main>
  );
}
