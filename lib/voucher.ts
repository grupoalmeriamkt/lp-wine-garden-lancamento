import { randomBytes, randomUUID } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

/** Generates a human-friendly voucher code like WG-7KP4-9QX2 */
export function generateVoucherCode(): string {
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
    if (i === 3) out += "-";
  }
  return `WG-${out}`;
}

export function newId(): string {
  return randomUUID();
}

/** Normalizes a Brazilian phone to digits only (with country code when possible). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 || digits.length === 10) return `55${digits}`;
  return digits;
}

/** Validates a BR mobile with WhatsApp (10-13 digits, DDD + number). */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}

/** Simple e-mail format check. */
export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}

/** Formats CPF digits as 000.000.000-00 while typing. */
export function formatCpf(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Validates a Brazilian CPF (check digits). */
export function isValidCpf(raw: string): boolean {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(c[i], 10) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(c[9], 10) && calc(10) === parseInt(c[10], 10);
}

/** CPF digits only (for storage). */
export function normalizeCpf(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Returns age in full years for a YYYY-MM-DD date (today = 2026 aware). */
export function ageFromBirthdate(birth: string, ref: Date = new Date()): number {
  const b = new Date(birth + "T00:00:00");
  if (isNaN(b.getTime())) return -1;
  let age = ref.getFullYear() - b.getFullYear();
  const m = ref.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < b.getDate())) age--;
  return age;
}

export function isAdult(birth: string): boolean {
  return ageFromBirthdate(birth) >= 18;
}

/** Formats typed digits into DD/MM/YYYY while the user types. */
export function formatBrBirthInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parses DD/MM/YYYY into YYYY-MM-DD, or null when invalid. */
export function parseBrBirthdate(value: string): string | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const iso = `${yyyy}-${mm}-${dd}`;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  if (
    d.getFullYear() !== Number(yyyy) ||
    d.getMonth() + 1 !== Number(mm) ||
    d.getDate() !== Number(dd)
  ) {
    return null;
  }
  return iso;
}

/** Voucher validity: end of the campaign courtesy window (07/08/2026). */
export function defaultExpiry(): string {
  return new Date("2026-08-07T23:59:59-03:00").toISOString();
}

export function buildQrPayload(code: string, siteUrl: string): string {
  const base = siteUrl?.replace(/\/$/, "") || "";
  return `${base}/winegarden/validar/${code}`;
}
