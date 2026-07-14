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

/** Voucher validity window: 30 days from creation. */
export function defaultExpiry(from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

export function buildQrPayload(code: string, siteUrl: string): string {
  const base = siteUrl?.replace(/\/$/, "") || "";
  return `${base}/winegarden/validar/${code}`;
}
