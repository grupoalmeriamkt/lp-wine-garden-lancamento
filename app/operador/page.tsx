"use client";
import { useEffect, useRef, useState } from "react";
import { glassLabel } from "@/lib/glasses";
import type { Voucher } from "@/lib/types";

function extractCode(text: string): string | null {
  const m = text.match(/(WG-[A-Z0-9]{4}-[A-Z0-9]{4})/i);
  return m ? m[1].toUpperCase() : null;
}

export default function Operador() {
  const [manual, setManual] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function lookup(code: string) {
    setBusy(true); setMsg(""); setVoucher(null);
    const res = await fetch(`/api/voucher/${code}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error === "not_found" ? "Convite não encontrado." : "Erro ao consultar."); return; }
    setVoucher(data.voucher);
  }

  async function redeem() {
    if (!voucher) return;
    setBusy(true);
    const res = await fetch(`/api/voucher/${voucher.voucher_code}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "redeem", redeemed_by: "operador" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(
        data.error === "already_redeemed" ? "⚠️ Convite JÁ resgatado." :
        data.error === "expired" ? "Convite expirado." : "Não foi possível resgatar."
      );
      lookup(voucher.voucher_code);
      return;
    }
    setVoucher(data.voucher);
    setMsg("✅ Resgatado com sucesso!");
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    const Detector = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (!Detector) { setMsg("Câmera não suportada neste navegador. Use o código manual."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const found = codes.map((c: any) => extractCode(c.rawValue)).find(Boolean);
          if (found) { stopScan(); await lookup(found); return; }
        } catch {}
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setMsg("Não foi possível acessar a câmera.");
      setScanning(false);
    }
  }

  useEffect(() => () => stopScan(), []);

  const statusLabel: Record<string, string> = {
    active: "Ativo — pode resgatar", redeemed: "Já resgatado",
    expired: "Expirado", cancelled: "Cancelado",
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--uva)" }}>
      <div className="ticket" style={{ maxWidth: 460, width: "100%", padding: 30, background: "var(--offwhite)" }}>
        <span className="eyebrow" style={{ color: "var(--purpura)" }}>Validação — equipe Wine Garden</span>
        <h1 style={{ fontSize: "1.9rem", marginTop: 10, color: "var(--uva)" }}>Validar convite</h1>

        {scanning ? (
          <>
            <video ref={videoRef} playsInline style={{ width: "100%", borderRadius: 8, marginTop: 16, background: "#000" }} />
            <button className="btn" onClick={stopScan} style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>Parar câmera</button>
          </>
        ) : (
          <button className="btn" onClick={startScan} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>📷 Ler QR pela câmera</button>
        )}

        <form onSubmit={(e) => { e.preventDefault(); const c = extractCode(manual) || manual.trim().toUpperCase(); if (c) lookup(c); }} style={{ marginTop: 16 }}>
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Código (ex.: WG-XXXX-YYYY)"
            style={{ width: "100%", padding: "12px 14px", fontSize: 16 }} />
          <button className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>Consultar código</button>
        </form>

        {msg && <p className="body" style={{ marginTop: 16, fontWeight: 600, color: "var(--purpura)" }}>{msg}</p>}

        {voucher && (
          <div style={{ marginTop: 20 }}>
            <hr className="dotted" />
            <p className="mono-label" style={{ color: "var(--uva-70)", marginTop: 14 }}>Código</p>
            <p className="body">{voucher.voucher_code}</p>
            <p className="mono-label" style={{ color: "var(--uva-70)" }}>Taça</p>
            <p className="body">{glassLabel(voucher.selected_glass)}</p>
            <p className="mono-label" style={{ color: "var(--uva-70)" }}>Status</p>
            <p className="body" style={{ fontWeight: 600 }}>{statusLabel[voucher.status] ?? voucher.status}</p>
            {voucher.status === "active" && (
              <button className="btn" disabled={busy} onClick={redeem} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
                {busy ? "Resgatando…" : "Resgatar convite"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
