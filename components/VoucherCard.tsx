"use client";
import { useEffect } from "react";
import { glassById } from "@/lib/glasses";
import { VENUE } from "@/lib/config";
import { track } from "@/lib/tracking";
import type { CreateVoucherResult } from "@/lib/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function VoucherCard({
  result,
  onClose,
}: {
  result: CreateVoucherResult;
  onClose: () => void;
}) {
  const { voucher, lead, qrDataUrl } = result;
  const g = glassById(voucher.selected_glass);

  useEffect(() => {
    document.body.classList.add("overlay-open");
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("overlay-open");
      document.body.style.overflow = "";
    };
  }, []);

  const waText = encodeURIComponent(
    `Meu convite Wine Garden — ${g?.name}\nCódigo: ${voucher.voucher_code}\nApresente na casa: ${voucher.qr_payload}`
  );

  return (
    <div className="voucher-overlay">
      <div className="voucher-scroll">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo/wg-horizontal-bege-fundotransp.svg"
          alt="Wine Garden"
          className="voucher-logo"
        />

        <p className="eyebrow center" style={{ color: "var(--bege)", marginBottom: 30 }}>
          Convite confirmado
        </p>

        <div className="voucher-card">
          <div className="voucher-card__head">
            <div>
              <span className="mono-label" style={{ color: "var(--uva-70)" }}>
                Nova fase · Brasília
              </span>
              <h2 className="voucher-title">Seu convite está pronto.</h2>
            </div>
            <img
              src={g?.taca ?? "/brand/elementos/taca-granada.svg"}
              alt=""
              aria-hidden
              className="voucher-taca"
            />
          </div>

          <p className="body muted" style={{ marginTop: 4, marginBottom: 22 }}>
            Apresente este convite no Wine Garden e brinde a primeira taça da nova
            fase.
          </p>

          <hr className="dotted" />

          <div className="voucher-card__grid">
            <div className="voucher-info">
              <Row label="Convidado" value={lead.name} />
              <Row label="Taça escolhida" value={g?.name ?? "—"} />
              <Row label="Código do convite" value={voucher.voucher_code} mono />
              <Row label="Validade" value={fmtDate(voucher.expires_at)} />
              <Row label="Status" value="Ativo" />
            </div>

            <div className="voucher-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR Code do convite ${voucher.voucher_code}`} />
              <span className="tiny muted center" style={{ display: "block", marginTop: 8 }}>
                Apresente na entrada
              </span>
            </div>
          </div>

          <hr className="dotted" />

          <div className="voucher-rules">
            <span className="mono-label" style={{ color: "var(--uva-70)" }}>
              Regras rápidas
            </span>
            <ul>
              <li>Convite individual e intransferível.</li>
              <li>Uma cortesia por telefone cadastrado.</li>
              <li>Válido somente para maiores de 18 anos.</li>
              <li>Rótulos sujeitos à disponibilidade. Resgate presencial.</li>
            </ul>
          </div>
        </div>

        <div className="voucher-actions">
          <a
            className="btn btn--light"
            href={VENUE.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("maps_click", { code: voucher.voucher_code })}
          >
            📍 Abrir rota no Maps
          </a>
          <a
            className="btn btn--outline-light"
            href={`${VENUE.whatsapp.split("?")[0]}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { code: voucher.voucher_code })}
          >
            Enviar para meu WhatsApp
          </a>
          <a
            className="btn btn--outline-light"
            href={VENUE.reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("reservation_click", { code: voucher.voucher_code })}
          >
            Reservar uma mesa
          </a>
        </div>

        <button className="voucher-back" onClick={onClose}>
          ← Voltar para a página
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="voucher-row">
      <span className="mono-label" style={{ color: "var(--uva-70)" }}>
        {label}
      </span>
      <span
        className={`voucher-value ${mono ? "voucher-value--mono" : "voucher-value--serif"}`}
      >
        {value}
      </span>
    </div>
  );
}
