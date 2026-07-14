"use client";
import { useMemo, useState } from "react";
import type { EmailStatus } from "@/lib/types";
import { GLASSES } from "@/lib/glasses";

export interface AdminRow {
  id: string;
  name: string; phone: string; email: string; cpf: string;
  birth_date: string; glass: string; glassName: string;
  code: string | null; voucherStatus: string | null;
  email_status: EmailStatus; created_at: string;
}

const emailBadge: Record<string, { label: string; color: string }> = {
  none: { label: "—", color: "#999" },
  sent: { label: "Enviado", color: "#414417" },
  resent: { label: "Reenviado", color: "#414417" },
  delivered: { label: "Entregue", color: "#2b6", },
  opened: { label: "Aberto", color: "#0a7" },
  bounced: { label: "Falhou", color: "#c33" },
  complained: { label: "Spam", color: "#c33" },
};

export default function AdminTable({ rows }: { rows: AdminRow[] }) {
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.cpf, r.code ?? ""].some((v) => v.toLowerCase().includes(t))
    );
  }, [q, rows]);

  async function call(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert("Erro: " + (d.error ?? res.status));
      return false;
    }
    return true;
  }

  async function act(fn: () => Promise<boolean>, id: string) {
    setBusyId(id);
    const ok = await fn();
    setBusyId(null);
    if (ok) location.reload();
  }

  return (
    <main style={{ padding: 24, background: "var(--uva)", minHeight: "100vh", color: "var(--offwhite)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Inscritos ({rows.length})</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="btn" href="/api/admin/export">Exportar CSV</a>
          <button className="btn" onClick={() => (window.location.hash = "novo")}>+ Adicionar</button>
          <button className="btn" onClick={async () => { await fetch("/api/auth/admin", { method: "DELETE" }); location.href = "/admin/login"; }}>Sair</button>
        </div>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail, telefone, CPF ou código…"
        style={{ width: "100%", margin: "16px 0", padding: "12px 14px", fontSize: 16 }} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--uva-70)" }}>
              {["QR", "Nome", "Telefone", "E-mail", "CPF", "Taça", "Código", "Voucher", "Status e-mail", "Criado", "Ações"].map((h) => (
                <th key={h} style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const badge = emailBadge[r.email_status.stage] ?? emailBadge.none;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                  <td style={{ padding: "6px" }}>
                    {r.code && <a href={`/api/qr/${r.code}`} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/qr/${r.code}`} alt="QR" width={44} height={44} style={{ background: "#fff", borderRadius: 4 }} />
                    </a>}
                  </td>
                  <td style={{ padding: "6px" }}>{r.name}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>{r.phone}</td>
                  <td style={{ padding: "6px" }}>{r.email}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>{r.cpf}</td>
                  <td style={{ padding: "6px" }}>{r.glassName}</td>
                  <td style={{ padding: "6px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.code ?? "—"}</td>
                  <td style={{ padding: "6px" }}>{r.voucherStatus ?? "—"}</td>
                  <td style={{ padding: "6px", color: badge.color, fontWeight: 600 }} title={r.email_status.openedAt ?? r.email_status.sentAt ?? ""}>{badge.label}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>
                    <RowActions r={r} busy={busyId === r.id} act={act} call={call} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewLeadForm />
    </main>
  );
}

function RowActions({ r, busy, act, call }: {
  r: AdminRow; busy: boolean;
  act: (fn: () => Promise<boolean>, id: string) => void;
  call: (url: string, method: string, body?: unknown) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: r.name, phone: r.phone, email: r.email, cpf: r.cpf });

  if (editing) {
    return (
      <div style={{ display: "grid", gap: 4, minWidth: 200 }}>
        {(["name", "phone", "email", "cpf"] as const).map((k) => (
          <input key={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k} style={{ padding: 4, fontSize: 12 }} />
        ))}
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/leads/${r.id}`, "PATCH", form), r.id)}>Salvar</button>
          <button className="btn" onClick={() => setEditing(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      <button className="btn" onClick={() => setEditing(true)}>Editar</button>
      {r.code && <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/resend/${r.code}`, "POST"), r.id)}>Reenviar</button>}
      {r.code && r.voucherStatus !== "redeemed" && <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/vouchers/${r.code}`, "PATCH", { action: "redeem" }), r.id)}>Resgatar</button>}
      {r.code && r.voucherStatus !== "cancelled" && <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/vouchers/${r.code}`, "PATCH", { action: "cancel" }), r.id)}>Cancelar</button>}
      <button className="btn" disabled={busy} onClick={() => { if (confirm(`Excluir ${r.name}?`)) act(() => call(`/api/admin/leads/${r.id}`, "DELETE"), r.id); }}>Excluir</button>
    </div>
  );
}

function NewLeadForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", cpf: "", birth_date: "", selected_glass: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/admin/leads", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { alert("Erro: " + (d.error ?? res.status)); return; }
    location.reload();
  }
  return (
    <form id="novo" onSubmit={submit} style={{ marginTop: 40, padding: 20, background: "rgba(255,255,255,.06)", borderRadius: 8, maxWidth: 480 }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Adicionar inscrito</h2>
      {(["name", "phone", "email", "cpf"] as const).map((k) => (
        <input key={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={k}
          style={{ width: "100%", marginBottom: 8, padding: "10px 12px" }} />
      ))}
      <input value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} placeholder="Nascimento (YYYY-MM-DD)" style={{ width: "100%", marginBottom: 8, padding: "10px 12px" }} />
      <select value={form.selected_glass} onChange={(e) => setForm({ ...form, selected_glass: e.target.value })}
        style={{ width: "100%", marginBottom: 8, padding: "10px 12px" }}>
        <option value="">Selecione a taça…</option>
        {GLASSES.map((g) => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <button className="btn" disabled={busy}>{busy ? "Criando…" : "Criar + enviar e-mail"}</button>
    </form>
  );
}
