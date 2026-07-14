/**
 * Persistence layer with two drivers:
 *  - Supabase (when env vars are present)
 *  - Local JSON file under .data/ (automatic fallback for demo/dev)
 *
 * Public API is driver-agnostic so API routes never branch on the backend.
 */
import { promises as fs } from "fs";
import path from "path";
import { getSupabaseAdmin } from "./supabase";
import type { Lead, LeadInput, Voucher } from "./types";
import type { EmailEvent, EmailEventType, EmailStatus } from "./types";

/* ----------------------------- Local driver ----------------------------- */

const DATA_DIR = path.join(process.cwd(), ".data");
const LEADS_FILE = path.join(DATA_DIR, "winegarden_leads.json");
const VOUCHERS_FILE = path.join(DATA_DIR, "winegarden_vouchers.json");
const EMAIL_EVENTS_FILE = path.join(DATA_DIR, "winegarden_email_events.json");

const STAGE_ORDER: Record<EmailEventType, number> = {
  sent: 1,
  resent: 1,
  delivered: 2,
  opened: 3,
  bounced: 2,
  complained: 2,
};

async function readJson<T>(file: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

async function writeJson<T>(file: string, data: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

/* ------------------------------- Public API ------------------------------ */

export async function findLeadByPhone(phone: string): Promise<Lead | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data } = await sb
      .from("winegarden_leads")
      .select("*")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();
    return (data as Lead) ?? null;
  }
  const leads = await readJson<Lead>(LEADS_FILE);
  return leads.find((l) => l.phone === phone) ?? null;
}

export async function findLeadByCpf(cpf: string): Promise<Lead | null> {
  if (!cpf) return null;
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data } = await sb
      .from("winegarden_leads")
      .select("*")
      .eq("cpf", cpf)
      .limit(1)
      .maybeSingle();
    return (data as Lead) ?? null;
  }
  const leads = await readJson<Lead>(LEADS_FILE);
  return leads.find((l) => l.cpf === cpf) ?? null;
}

export async function insertLead(lead: Lead): Promise<Lead> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("winegarden_leads")
      .insert(lead)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Lead;
  }
  const leads = await readJson<Lead>(LEADS_FILE);
  leads.push(lead);
  await writeJson(LEADS_FILE, leads);
  return lead;
}

export async function insertVoucher(voucher: Voucher): Promise<Voucher> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("winegarden_vouchers")
      .insert(voucher)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Voucher;
  }
  const vouchers = await readJson<Voucher>(VOUCHERS_FILE);
  vouchers.push(voucher);
  await writeJson(VOUCHERS_FILE, vouchers);
  return voucher;
}

export async function findVoucherByLeadId(leadId: string): Promise<Voucher | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data } = await sb
      .from("winegarden_vouchers")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as Voucher) ?? null;
  }
  const vouchers = await readJson<Voucher>(VOUCHERS_FILE);
  return vouchers.find((v) => v.lead_id === leadId) ?? null;
}

export async function findVoucherByCode(code: string): Promise<Voucher | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data } = await sb
      .from("winegarden_vouchers")
      .select("*")
      .eq("voucher_code", code)
      .limit(1)
      .maybeSingle();
    return (data as Voucher) ?? null;
  }
  const vouchers = await readJson<Voucher>(VOUCHERS_FILE);
  return vouchers.find((v) => v.voucher_code === code) ?? null;
}

export async function updateVoucher(
  code: string,
  patch: Partial<Voucher>
): Promise<Voucher | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("winegarden_vouchers")
      .update(patch)
      .eq("voucher_code", code)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Voucher) ?? null;
  }
  const vouchers = await readJson<Voucher>(VOUCHERS_FILE);
  const idx = vouchers.findIndex((v) => v.voucher_code === code);
  if (idx === -1) return null;
  vouchers[idx] = { ...vouchers[idx], ...patch };
  await writeJson(VOUCHERS_FILE, vouchers);
  return vouchers[idx];
}

export async function insertEmailEvent(evt: EmailEvent): Promise<void> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { error } = await sb.from("winegarden_email_events").insert(evt);
    if (error) throw new Error(error.message);
    return;
  }
  const rows = await readJson<EmailEvent>(EMAIL_EVENTS_FILE);
  rows.push(evt);
  await writeJson(EMAIL_EVENTS_FILE, rows);
}

export async function emailStatusByCodes(
  codes: string[]
): Promise<Record<string, EmailStatus>> {
  const out: Record<string, EmailStatus> = {};
  if (codes.length === 0) return out;
  for (const code of codes) out[code] = { stage: "none" };

  let rows: EmailEvent[] = [];
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data } = await sb
      .from("winegarden_email_events")
      .select("*")
      .in("voucher_code", codes);
    rows = (data as EmailEvent[]) ?? [];
  } else {
    const all = await readJson<EmailEvent>(EMAIL_EVENTS_FILE);
    rows = all.filter((r) => r.voucher_code && codes.includes(r.voucher_code));
  }

  // Mapa resend_id -> code (a partir dos eventos 'sent'/'resent' já carregados).
  const idToCode = new Map<string, string>();
  for (const r of rows) {
    if (r.resend_id && r.voucher_code) idToCode.set(r.resend_id, r.voucher_code);
  }

  // Eventos com voucher_code nulo mas resend_id conhecido.
  let orphans: EmailEvent[] = [];
  if (sb && idToCode.size > 0) {
    const { data } = await sb
      .from("winegarden_email_events")
      .select("*")
      .is("voucher_code", null)
      .in("resend_id", Array.from(idToCode.keys()));
    orphans = (data as EmailEvent[]) ?? [];
  } else if (!sb) {
    const all = await readJson<EmailEvent>(EMAIL_EVENTS_FILE);
    orphans = all.filter(
      (r) => !r.voucher_code && r.resend_id && idToCode.has(r.resend_id)
    );
  }
  for (const o of orphans) o.voucher_code = idToCode.get(o.resend_id!)!;

  for (const r of [...rows, ...orphans]) {
    const code = r.voucher_code!;
    if (!out[code]) continue;
    const st = out[code];
    if (r.type === "sent" || r.type === "resent") st.sentAt = r.created_at;
    if (r.type === "delivered") st.deliveredAt = r.created_at;
    if (r.type === "opened") st.openedAt = r.created_at;
    if (r.type === "bounced") st.bouncedAt = r.created_at;
    const cur = st.stage === "none" ? 0 : STAGE_ORDER[st.stage];
    if (STAGE_ORDER[r.type] >= cur) st.stage = r.type;
  }
  return out;
}

export type { Lead, LeadInput, Voucher };
