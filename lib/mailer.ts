import { Resend } from "resend";
import { buildVoucherEmailHtml, voucherEmailSubject, VoucherEmailData } from "./email";

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

/**
 * Envia o e-mail de confirmação do convite via Resend.
 * NÃO é chamado automaticamente ainda — aguardando aprovação do template.
 */
export async function sendVoucherEmail(to: string, data: VoucherEmailData) {
  if (!isEmailConfigured()) {
    return { skipped: true, reason: "resend_not_configured" as const };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL as string;

  const { data: sent, error } = await resend.emails.send({
    from: `Wine Garden <${from}>`,
    to,
    subject: voucherEmailSubject(data.name),
    html: buildVoucherEmailHtml(data),
  });
  if (error) throw new Error(error.message);
  return { id: sent?.id, skipped: false };
}
