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

/* ----------------------------- Local driver ----------------------------- */

const DATA_DIR = path.join(process.cwd(), ".data");
const LEADS_FILE = path.join(DATA_DIR, "winegarden_leads.json");
const VOUCHERS_FILE = path.join(DATA_DIR, "winegarden_vouchers.json");

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

export type { Lead, LeadInput, Voucher };
