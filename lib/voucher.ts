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
