"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm({ role, title, next }: { role: "admin" | "operator"; title: string; next: string }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch(`/api/auth/${role}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) { setErr("Senha inválida."); return; }
    router.push(sp.get("next") || next);
    router.refresh();
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--uva)", padding: 24 }}>
      <form onSubmit={submit} className="ticket" style={{ maxWidth: 380, width: "100%", padding: 30, background: "var(--offwhite)" }}>
        <span className="eyebrow" style={{ color: "var(--purpura)" }}>Acesso restrito</span>
        <h1 style={{ fontSize: "1.8rem", marginTop: 10, color: "var(--uva)" }}>{title}</h1>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha" autoFocus
          style={{ width: "100%", marginTop: 20, padding: "12px 14px", fontSize: 16 }}
        />
        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
        <button className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
