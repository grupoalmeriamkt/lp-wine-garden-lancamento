import "server-only";

export type Role = "admin" | "operator";

export const COOKIE = { admin: "wg_admin", operator: "wg_operator" } as const;

const enc = new TextEncoder();

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET não definido — configure-o antes de habilitar /admin e /operador em produção.");
    }
    return "dev-insecure-secret-change-me";
  }
  return s;
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Token = "<role>.<hmac(role)>". */
export async function signRole(role: Role): Promise<string> {
  return `${role}.${await hmacHex(role)}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyToken(
  token: string | undefined,
  role: Role
): Promise<boolean> {
  if (!token) return false;
  const [tRole, tSig] = token.split(".");
  if (tRole !== role || !tSig) return false;
  return timingSafeEqual(tSig, await hmacHex(role));
}

export function passwordFor(role: Role): string | undefined {
  return role === "admin"
    ? process.env.ADMIN_PASSWORD
    : process.env.OPERATOR_PASSWORD;
}
