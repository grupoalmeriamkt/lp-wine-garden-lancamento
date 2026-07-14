import { CAMPAIGN, VENUE } from "@/lib/config";
import type { Lead, Voucher } from "@/lib/types";
import { glassById } from "@/lib/glasses";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function buildVoucherEmailHtml({
  lead,
  voucher,
  qrDataUrl,
}: {
  lead: Lead;
  voucher: Voucher;
  qrDataUrl: string;
}) {
  const glass = glassById(voucher.selected_glass);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://winegarden.com.br";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Seu convite Wine Garden</title>
</head>
<body style="margin:0;padding:0;background:#f7f9ea;font-family:Georgia,serif;color:#3f0a25;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f9ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #c7ae9a;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="padding:32px 28px 20px;text-align:center;">
              <img src="${siteUrl}/brand/logo/wg-horizontal-granada-fundotransp.svg" alt="Wine Garden" width="220" style="display:block;margin:0 auto 20px;" />
              <p style="margin:0 0 8px;font-family:monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#891a3d;">Convite confirmado</p>
              <h1 style="margin:0;font-size:30px;font-weight:400;line-height:1.1;">Seu convite está pronto.</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;">
              <div style="background:#3f0a25;color:#f7f9ea;border-radius:8px;padding:20px 22px;text-align:center;">
                <p style="margin:0 0 6px;font-family:monospace;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#c7ae9a;">Período da cortesia</p>
                <p style="margin:0 0 8px;font-size:24px;line-height:1.2;">De ${CAMPAIGN.courtesyPeriod.label}</p>
                <p style="margin:0;font-family:monospace;font-size:13px;line-height:1.6;color:rgba(247,249,234,0.88);">
                  Utilize seu convite nesse período para brindar a primeira taça da nova fase.
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-family:monospace;font-size:14px;line-height:1.7;color:rgba(63,10,37,0.82);">
              <p style="margin:0 0 16px;">Olá, ${lead.name}. Apresente este convite no Wine Garden e brinde a primeira taça da nova fase.</p>
              <p style="margin:0 0 8px;"><strong>Convidado:</strong> ${lead.name}</p>
              <p style="margin:0 0 8px;"><strong>Taça escolhida:</strong> ${glass?.name ?? "—"}</p>
              <p style="margin:0 0 8px;"><strong>Código:</strong> ${voucher.voucher_code}</p>
              <p style="margin:0 0 16px;"><strong>Validade:</strong> ${fmtDate(voucher.expires_at)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <img src="${qrDataUrl}" alt="QR Code do convite" width="220" height="220" style="display:block;margin:0 auto 10px;" />
              <p style="margin:0;font-family:monospace;font-size:12px;color:rgba(63,10,37,0.6);">Apresente na entrada</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px dashed rgba(63,10,37,0.18);font-family:monospace;font-size:12px;line-height:1.6;color:rgba(63,10,37,0.65);">
              <p style="margin:0 0 8px;">${VENUE.addressLines.join(" · ")}</p>
              <p style="margin:0;">Convite individual e intransferível. Válido para maiores de 18 anos. Oferecimento Caixa, apoio Visa e Elo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVoucherEmail({
  to,
  lead,
  voucher,
  qrDataUrl,
}: {
  to: string;
  lead: Lead;
  voucher: Voucher;
  qrDataUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false as const, reason: "email_not_configured" };

  const html = buildVoucherEmailHtml({ lead, voucher, qrDataUrl });
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Seu convite Wine Garden está pronto",
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return { sent: false as const, reason: "send_failed", detail };
  }

  return { sent: true as const };
}
