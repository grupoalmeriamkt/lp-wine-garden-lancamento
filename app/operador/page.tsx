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
  const rafRef = useRef<number | null>(null);

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
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMsg("Câmera não disponível neste navegador. Use o código manual.");
      return;
    }
    setMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      // O <video> só monta após este setState; a conexão do stream e o loop
      // de leitura acontecem no useEffect abaixo, quando o elemento já existe.
      // (No iOS, anexar o stream antes do vídeo montar deixa a tela preta.)
      setScanning(true);
    } catch {
      setMsg("Não foi possível acessar a câmera. Verifique a permissão ou use o código manual.");
    }
  }

  // Conecta a câmera ao <video> e roda o loop de leitura DEPOIS que o vídeo
  // monta no DOM. Essencial no iOS Safari.
  useEffect(() => {
    if (!scanning) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    let cancelled = false;
    video.srcObject = stream;
    video.muted = true; // iOS: precisa ser setado no DOM, não só via prop React
    video.setAttribute("playsinline", "true");

    const run = async () => {
      try {
        await video.play();
      } catch {}

      // Caminho rápido: BarcodeDetector nativo (Android/Chrome).
      // Fallback universal (iOS Safari não tem BarcodeDetector): jsQR sobre
      // os frames da câmera desenhados num canvas.
      const Detector = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
      const detector = Detector ? new Detector({ formats: ["qr_code"] }) : null;
      type Decoder = (
        d: Uint8ClampedArray,
        w: number,
        h: number
      ) => { data: string } | null;
      let decodeFrame: Decoder | null = null;
      if (!detector) {
        decodeFrame = (await import("jsqr")).default as unknown as Decoder;
      }
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const tick = async () => {
        if (cancelled || !streamRef.current) return;
        try {
          let found: string | null = null;
          if (detector) {
            const codes = await detector.detect(video);
            found = codes.map((c: any) => extractCode(c.rawValue)).find(Boolean) ?? null;
          } else if (decodeFrame && ctx && video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const r = decodeFrame(img.data, img.width, img.height);
            if (r) found = extractCode(r.data);
          }
          if (found) { stopScan(); await lookup(found); return; }
        } catch {}
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  // Ao desmontar, garante que a câmera é desligada.
  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

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
            <video ref={videoRef} playsInline muted autoPlay style={{ width: "100%", borderRadius: 8, marginTop: 16, background: "#000" }} />
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
