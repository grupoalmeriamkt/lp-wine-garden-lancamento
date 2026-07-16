import { VENUE, CAMPAIGN } from "./config";

export interface VoucherEmailData {
  name: string;
  glassName: string;
  code: string;
  validade: string; // texto já formatado (ex.: "13 de agosto de 2026")
  voucherUrl: string; // link para o convite online
  qrUrl: string; // URL absoluta https do PNG do QR (data: é bloqueado no Gmail)
  logoUrl: string; // URL absoluta do PNG bege
  mapsUrl?: string;
}

const C = {
  offwhite: "#f7f9ea",
  uva: "#3f0a25",
  granada: "#5b0718",
  purpura: "#891a3d",
  bege: "#c7ae9a",
  oliva: "#414417",
};

// Fontes web-safe (clientes de e-mail não carregam @font-face de forma confiável)
const SERIF = "Georgia, 'Times New Roman', serif";
const MONO = "'Courier New', Courier, monospace";

const firstName = (full: string) => full.trim().split(/\s+/)[0] || full;

/** Monta o HTML do e-mail de confirmação (table-based, estilos inline). */
export function buildVoucherEmailHtml(d: VoucherEmailData): string {
  const period = CAMPAIGN.courtesyPeriod.label;
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Seu convite Wine Garden</title>
</head>
<body style="margin:0;padding:0;background-color:${C.granada};">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">A primeira taça da nova fase é sua — apresente este convite no Wine Garden.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.granada};padding:28px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

      <!-- Header -->
      <tr><td align="center" style="padding:18px 0 30px;">
        <img src="${d.logoUrl}" width="230" alt="Wine Garden" style="display:block;width:230px;max-width:66%;height:auto;border:0;">
      </td></tr>

      <!-- Card -->
      <tr><td style="background-color:${C.offwhite};border-radius:10px;padding:38px 34px;">

        <p style="margin:0 0 6px;font-family:${MONO};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.purpura};">
          Convite confirmado
        </p>
        <h1 style="margin:0 0 6px;font-family:${SERIF};font-weight:400;font-size:34px;line-height:1.08;color:${C.uva};">
          Seu convite está pronto.
        </h1>
        <p style="margin:0 0 22px;font-family:${MONO};font-size:14px;line-height:1.7;color:rgba(63,10,37,0.72);">
          Olá, ${firstName(d.name)}. Apresente este convite no Wine Garden e brinde a
          primeira taça da nova fase.
        </p>

        <hr style="border:none;border-top:1px dashed ${C.bege};margin:0 0 22px;">

        <!-- Detalhes + QR -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td valign="top" style="padding-right:16px;">
              ${row("Convidado", d.name)}
              ${row("Taça escolhida", d.glassName)}
              ${row("Código do convite", d.code, true)}
              ${row("Validade", d.validade)}
            </td>
            <td valign="top" width="168" align="center">
              <img src="${d.qrUrl}" width="150" height="150" alt="QR Code do convite ${d.code}" style="display:block;width:150px;height:150px;border:1px solid rgba(63,10,37,0.18);border-radius:8px;background:#fff;padding:6px;">
              <p style="margin:8px 0 0;font-family:${MONO};font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(63,10,37,0.5);">Apresente na entrada</p>
            </td>
          </tr>
        </table>

        <hr style="border:none;border-top:1px dashed ${C.bege};margin:24px 0;">

        <!-- CTA -->
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr><td align="center" bgcolor="${C.uva}" style="border-radius:999px;">
            <a href="${d.voucherUrl}" style="display:inline-block;padding:15px 34px;font-family:${MONO};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${C.offwhite};text-decoration:none;">
              Ver meu convite &rarr;
            </a>
          </td></tr>
        </table>
        <p style="margin:14px 0 0;text-align:center;font-family:${MONO};font-size:11px;color:rgba(63,10,37,0.55);">
          Válido de ${period}. Resgate presencial no Wine Garden.
        </p>

        <hr style="border:none;border-top:1px dashed ${C.bege};margin:24px 0 18px;">

        <!-- Regras -->
        <p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(63,10,37,0.6);">Regras rápidas</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:${MONO};font-size:12px;line-height:1.9;color:rgba(63,10,37,0.72);">
          <tr><td>• Convite individual e intransferível.</td></tr>
          <tr><td>• Uma cortesia por telefone cadastrado.</td></tr>
          <tr><td>• Válido somente para maiores de 18 anos.</td></tr>
          <tr><td>• Rótulos sujeitos à disponibilidade.</td></tr>
        </table>

        <!-- Patrocinadores -->
        <hr style="border:none;border-top:1px dashed ${C.bege};margin:24px 0 16px;">
        ${sponsorStrip(d.logoUrl)}
      </td></tr>

      <!-- Endereço -->
      <tr><td align="center" style="padding:26px 20px 8px;">
        <p style="margin:0;font-family:${SERIF};font-size:16px;color:${C.bege};line-height:1.5;">
          ${VENUE.addressLines.join(" · ")}
        </p>
        ${
          d.mapsUrl
            ? `<a href="${d.mapsUrl}" style="font-family:${MONO};font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.bege};text-decoration:underline;">Abrir rota no Maps</a>`
            : ""
        }
      </td></tr>

      <!-- Footer legal -->
      <tr><td align="center" style="padding:14px 24px 6px;">
        <p style="margin:0;font-family:${MONO};font-size:10px;line-height:1.7;color:rgba(199,174,154,0.7);">
          Campanha “A primeira taça da nova fase”. Um oferecimento Caixa, com apoio de
          Visa e Elo. Convite individual, válido para maiores de 18 anos, por tempo
          limitado e sujeito à disponibilidade. Beba com moderação.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Faixa "Oferecimento" com as bandeiras (Caixa/Visa/Elo), dentro do card claro
 * para bom contraste. Usa PNG + URLs absolutas + width/height explícitos porque
 * clientes de e-mail (Outlook) não suportam WebP nem caminhos relativos.
 */
function sponsorStrip(logoUrl: string): string {
  let base: string;
  try {
    base = `${new URL(logoUrl).origin}/brand/sponsors`;
  } catch {
    return ""; // sem origem absoluta confiável, não arrisca imagem quebrada
  }
  const logo = (file: string, alt: string, w: number, h: number) =>
    `<td valign="middle" style="padding:0 13px;"><img src="${base}/${file}" width="${w}" height="${h}" alt="${alt}" style="display:block;border:0;width:${w}px;height:${h}px;"></td>`;
  return `<p style="margin:0 0 12px;font-family:${MONO};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:rgba(63,10,37,0.6);text-align:center;">Oferecimento</p>
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            ${logo("caixa.png", "Cartões Caixa", 83, 26)}
            ${logo("visa.png", "Visa", 62, 20)}
            ${logo("elo.png", "Elo", 77, 24)}
          </tr>
        </table>`;
}

function row(label: string, value: string, mono = false): string {
  return `<div style="margin-bottom:14px;">
    <div style="font-family:${MONO};font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(63,10,37,0.6);margin-bottom:2px;">${label}</div>
    <div style="font-family:${mono ? MONO : SERIF};font-size:${mono ? "16px" : "20px"};letter-spacing:${mono ? "1px" : "0"};color:${C.granada};">${value}</div>
  </div>`;
}

export function voucherEmailSubject(name: string): string {
  return `${firstName(name)}, seu convite Wine Garden está pronto 🍷`;
}
