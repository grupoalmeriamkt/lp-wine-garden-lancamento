# Painel /admin + Página /operador — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar um painel `/admin` de gestão dos inscritos (busca, código/QR, status de e-mail, CRUD, CSV) e uma página `/operador` para validar vouchers por câmera ou código, impedindo reuso.

**Architecture:** Next.js 15 App Router. Autenticação por senha/papel com cookie HMAC verificado em `middleware.ts`. Tracking de e-mail via webhook do Resend gravando eventos numa tabela nova. Admin e operador reaproveitam a camada `lib/store.ts` (Supabase com fallback JSON) e a rota de resgate existente.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase (`@supabase/supabase-js`), Resend, `qrcode`, Web Crypto (`crypto.subtle`), `BarcodeDetector` (nativo do browser).

## Global Constraints

- Não adicionar dependências novas sem necessidade; scanner usa `BarcodeDetector` nativo (sem lib).
- `runtime = "nodejs"` em todas as rotas que usam `lib/store`, `crypto` de Node ou Resend.
- Toda API sob `/api/admin/*` exige cookie `wg_admin`; `middleware.ts` já barra, mas cada handler revalida com `requireRole`.
- Persistência sempre via `lib/store.ts` (nunca acessar Supabase direto nas rotas), mantendo o fallback JSON.
- Idioma da UI: pt-BR. Reusar tokens de `app/globals.css` (`--uva`, `--purpura`, `.btn`, `.ticket`, `.eyebrow`).
- Verificação de cada tarefa: `npm run build` deve passar; quando houver rota, testar via `curl`/navegador conforme descrito.
- Commits frequentes, um por tarefa concluída. Mensagens em pt-BR.
- Envs novas (documentar em `.env.example` se existir; senão criar): `ADMIN_PASSWORD`, `OPERATOR_PASSWORD`, `AUTH_SECRET`, `RESEND_WEBHOOK_SECRET`.

---

### Task 1: Camada de autenticação (`lib/auth.ts`)

**Files:**
- Create: `lib/auth.ts`

**Interfaces:**
- Produces:
  - `type Role = "admin" | "operator"`
  - `async function signRole(role: Role): Promise<string>` — retorna `"<role>.<hexHmac>"`.
  - `async function verifyToken(token: string | undefined, role: Role): Promise<boolean>`
  - `function passwordFor(role: Role): string | undefined` — lê `ADMIN_PASSWORD`/`OPERATOR_PASSWORD`.
  - `const COOKIE = { admin: "wg_admin", operator: "wg_operator" } as const`

- [ ] **Step 1: Implementar `lib/auth.ts`**

```ts
import "server-only";

export type Role = "admin" | "operator";

export const COOKIE = { admin: "wg_admin", operator: "wg_operator" } as const;

const enc = new TextEncoder();

function secret(): string {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
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
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila sem erros de tipo em `lib/auth.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/auth.ts
git commit -m "feat(auth): HMAC de sessão por papel (admin/operador)"
```

---

### Task 2: Login + logout (`/api/auth/[role]`)

**Files:**
- Create: `app/api/auth/[role]/route.ts`

**Interfaces:**
- Consumes: `signRole`, `verifyToken`, `passwordFor`, `COOKIE`, `Role` de `lib/auth`.
- Produces: `POST /api/auth/admin` e `/api/auth/operator` (body `{password}`) setam cookie; `DELETE` limpa.

- [ ] **Step 1: Implementar a rota**

```ts
import { NextRequest, NextResponse } from "next/server";
import { COOKIE, passwordFor, Role, signRole } from "@/lib/auth";

export const runtime = "nodejs";

function parseRole(v: string): Role | null {
  return v === "admin" || v === "operator" ? v : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  const role = parseRole((await params).role);
  if (!role) return NextResponse.json({ error: "bad_role" }, { status: 404 });

  const expected = passwordFor(role);
  if (!expected) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }
  const body = await req.json().catch(() => ({}));
  if (String(body.password ?? "") !== expected) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE[role], await signRole(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ role: string }> }
) {
  const role = parseRole((await params).role);
  if (!role) return NextResponse.json({ error: "bad_role" }, { status: 404 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE[role], "", { path: "/", maxAge: 0 });
  return res;
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build`, depois `npm run dev` e:
`curl -i -X POST localhost:3000/api/auth/admin -H 'content-type: application/json' -d '{"password":"errada"}'`
Expected: HTTP 401 `invalid_password` (assumindo `ADMIN_PASSWORD` setada) ou 500 `not_configured` se env ausente.

- [ ] **Step 3: Commit**

```bash
git add "app/api/auth/[role]/route.ts"
git commit -m "feat(auth): rota de login/logout por papel"
```

---

### Task 3: Middleware de proteção de rotas

**Files:**
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `verifyToken`, `COOKIE` de `lib/auth`.
- Produces: redireciona não-autenticados de `/admin/*` → `/admin/login` e `/operador/*` → `/operador/login`; barra `/api/admin/*` com 401.

- [ ] **Step 1: Implementar `middleware.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { COOKIE, verifyToken } from "@/lib/auth";

export const config = {
  matcher: ["/admin/:path*", "/operador/:path*", "/api/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Páginas de login são públicas.
  if (pathname === "/admin/login" || pathname === "/operador/login") {
    return NextResponse.next();
  }

  const isOperator = pathname.startsWith("/operador");
  const role = isOperator ? "operator" : "admin";
  const token = req.cookies.get(COOKIE[role])?.value;

  if (await verifyToken(token, role)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = isOperator ? "/operador/login" : "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build`; `npm run dev`; abrir `localhost:3000/admin` sem cookie.
Expected: redireciona para `/admin/login`. `curl -i localhost:3000/api/admin/export` → 401.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(auth): middleware protege /admin, /operador e /api/admin"
```

---

### Task 4: Tabela de eventos de e-mail (migração + tipos + store)

**Files:**
- Create: `supabase/migrations/0003_email_events.sql`
- Modify: `lib/types.ts` (adicionar tipos)
- Modify: `lib/store.ts` (adicionar funções)

**Interfaces:**
- Produces:
  - Tipos: `EmailEventType = "sent"|"resent"|"delivered"|"opened"|"bounced"|"complained"`; `EmailEvent`; `EmailStatus = { stage: EmailEventType|"none"; sentAt?: string; deliveredAt?: string; openedAt?: string; bouncedAt?: string }`.
  - `insertEmailEvent(evt: EmailEvent): Promise<void>`
  - `emailStatusByCodes(codes: string[]): Promise<Record<string, EmailStatus>>`

- [ ] **Step 1: Criar a migração**

```sql
-- supabase/migrations/0003_email_events.sql
-- Eventos de e-mail (Resend webhook) para o painel /admin.
create table if not exists public.winegarden_email_events (
  id           uuid primary key default gen_random_uuid(),
  resend_id    text,
  email        text not null,
  voucher_code text,
  type         text not null, -- sent|resent|delivered|opened|bounced|complained
  created_at   timestamptz not null default now(),
  raw          jsonb
);

create index if not exists winegarden_email_events_code_idx
  on public.winegarden_email_events (voucher_code);
create index if not exists winegarden_email_events_resend_idx
  on public.winegarden_email_events (resend_id);

alter table public.winegarden_email_events enable row level security;
-- Sem policy pública: acesso somente via service role.
```

- [ ] **Step 2: Adicionar tipos em `lib/types.ts`**

Adicionar ao final:

```ts
export type EmailEventType =
  | "sent"
  | "resent"
  | "delivered"
  | "opened"
  | "bounced"
  | "complained";

export interface EmailEvent {
  id: string;
  resend_id?: string | null;
  email: string;
  voucher_code?: string | null;
  type: EmailEventType;
  created_at: string;
  raw?: unknown;
}

export interface EmailStatus {
  stage: EmailEventType | "none";
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  bouncedAt?: string;
}
```

- [ ] **Step 3: Adicionar funções em `lib/store.ts`**

Importar os tipos no topo (`EmailEvent`, `EmailStatus`, `EmailEventType`) e adicionar. `newId` vem de `lib/voucher`; aqui gere via `crypto.randomUUID()` já disponível.

```ts
import type { EmailEvent, EmailEventType, EmailStatus } from "./types";

const EMAIL_EVENTS_FILE = path.join(DATA_DIR, "winegarden_email_events.json");

const STAGE_ORDER: Record<EmailEventType, number> = {
  sent: 1,
  resent: 1,
  delivered: 2,
  opened: 3,
  bounced: 2,
  complained: 2,
};

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

  for (const code of codes) out[code] = { stage: "none" };
  for (const r of rows) {
    const code = r.voucher_code!;
    const st = out[code] ?? { stage: "none" };
    if (r.type === "sent" || r.type === "resent") st.sentAt = r.created_at;
    if (r.type === "delivered") st.deliveredAt = r.created_at;
    if (r.type === "opened") st.openedAt = r.created_at;
    if (r.type === "bounced") st.bouncedAt = r.created_at;
    const cur = st.stage === "none" ? 0 : STAGE_ORDER[st.stage];
    if (STAGE_ORDER[r.type] >= cur) st.stage = r.type;
    out[code] = st;
  }
  return out;
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: compila. (A migração é aplicada manualmente no Supabase SQL Editor — documentar no commit.)

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0003_email_events.sql lib/types.ts lib/store.ts
git commit -m "feat(email): tabela de eventos + store de status de e-mail"
```

---

### Task 5: Mailer retorna id + grava evento no envio

**Files:**
- Modify: `lib/mailer.ts`
- Modify: `app/api/voucher/route.ts`

**Interfaces:**
- Consumes: `insertEmailEvent` de `lib/store`.
- Produces: `sendVoucherEmail` retorna `{ id?: string; skipped?: boolean }`; envio grava evento `sent` com `resend_id` + `voucher_code`.

- [ ] **Step 1: Ajustar `lib/mailer.ts` para tagear e retornar id**

Substituir o corpo de `sendVoucherEmail` para incluir `tags` e retornar o id:

```ts
export async function sendVoucherEmail(to: string, data: VoucherEmailData) {
  if (!isEmailConfigured()) {
    return { skipped: true as const, reason: "resend_not_configured" as const };
  }
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { data: sent, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: voucherEmailSubject(data),
    html: buildVoucherEmailHtml(data),
    tags: [{ name: "voucher_code", value: data.code }],
  });
  if (error) throw new Error(error.message);
  return { id: sent?.id, to, code: data.code };
}
```

(Manter os imports existentes; ajustar conforme a assinatura atual do arquivo.)

- [ ] **Step 2: Gravar evento `sent` em `app/api/voucher/route.ts`**

Trocar o bloco `void sendVoucherEmail(...)` por captura do resultado + evento. Importar no topo: `import { insertEmailEvent } from "@/lib/store";` (store já é importado — adicionar à lista) e `import { newId } from "@/lib/voucher";` (já importado).

```ts
void sendVoucherEmail(email, {
  name,
  glassName: glassLabel(selected_glass),
  code,
  validade: `${CAMPAIGN.courtesyPeriod.label} de 2026`,
  voucherUrl: voucher.qr_payload,
  qrUrl: `${base}/api/qr/${code}`,
  logoUrl: `${base}/brand/logo/wg-horizontal-bege.png`,
  mapsUrl: VENUE.mapsUrl,
})
  .then((r) => {
    if ("id" in r && r.id) {
      return insertEmailEvent({
        id: newId(),
        resend_id: r.id,
        email,
        voucher_code: code,
        type: "sent",
        created_at: new Date().toISOString(),
        raw: null,
      });
    }
  })
  .catch((e) => console.error("[voucher] email send failed", e));
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila sem erros.

- [ ] **Step 4: Commit**

```bash
git add lib/mailer.ts app/api/voucher/route.ts
git commit -m "feat(email): tagueia envio e grava evento 'sent'"
```

---

### Task 6: Webhook do Resend

**Files:**
- Create: `app/api/webhooks/resend/route.ts`

**Interfaces:**
- Consumes: `insertEmailEvent` de `lib/store`; `RESEND_WEBHOOK_SECRET`.
- Produces: `POST /api/webhooks/resend` grava `delivered/opened/bounced/complained` casando por `resend_id`.

**Nota sobre assinatura:** o Resend usa cabeçalhos svix (`svix-id`, `svix-timestamp`, `svix-signature`). Sem adicionar a lib `svix`, validamos comparando a mensagem `${svix_id}.${svix_timestamp}.${payload}` assinada com o secret (base64, o secret vem prefixado por `whsec_`). Implementação abaixo faz HMAC-SHA256 com Web Crypto.

- [ ] **Step 1: Implementar a rota**

```ts
import { NextRequest, NextResponse } from "next/server";
import { insertEmailEvent } from "@/lib/store";
import type { EmailEventType } from "@/lib/types";

export const runtime = "nodejs";

const MAP: Record<string, EmailEventType> = {
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.bounced": "bounced",
  "email.complained": "complained",
};

async function verify(
  secret: string,
  id: string,
  ts: string,
  payload: string,
  header: string
): Promise<boolean> {
  const keyB64 = secret.replace(/^whsec_/, "");
  const keyBytes = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${ts}.${payload}`)
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
  // Header vem como "v1,<b64> v1,<b64>...": comparar com qualquer um.
  return header
    .split(" ")
    .map((p) => p.split(",")[1])
    .some((s) => s === expected);
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const payload = await req.text();

  if (secret) {
    const id = req.headers.get("svix-id") ?? "";
    const ts = req.headers.get("svix-timestamp") ?? "";
    const sigHeader = req.headers.get("svix-signature") ?? "";
    const ok = await verify(secret, id, ts, payload, sigHeader);
    if (!ok) return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  const evt = JSON.parse(payload) as {
    type: string;
    data?: {
      email_id?: string;
      to?: string | string[];
      tags?: Record<string, string> | { name: string; value: string }[];
    };
    created_at?: string;
  };

  const type = MAP[evt.type];
  if (!type) return NextResponse.json({ ok: true, ignored: evt.type });

  const to = Array.isArray(evt.data?.to) ? evt.data?.to[0] : evt.data?.to;
  let code: string | undefined;
  const tags = evt.data?.tags;
  if (Array.isArray(tags)) code = tags.find((t) => t.name === "voucher_code")?.value;
  else if (tags && typeof tags === "object") code = (tags as Record<string, string>).voucher_code;

  await insertEmailEvent({
    id: crypto.randomUUID(),
    resend_id: evt.data?.email_id ?? null,
    email: to ?? "",
    voucher_code: code ?? null,
    type,
    created_at: evt.created_at ?? new Date().toISOString(),
    raw: evt,
  });

  return NextResponse.json({ ok: true });
}
```

**Nota:** se o Resend não enviar `voucher_code` na tag do webhook, o join no `/admin` cai para o `resend_id` gravado no envio (Task 5). Para robustez, na Task 7 a agregação também aceita casar por `resend_id` quando `voucher_code` estiver nulo — ver ajuste ali.

- [ ] **Step 2: Ajustar `emailStatusByCodes` para casar também por `resend_id`**

Em `lib/store.ts`, quando o driver Supabase: além de buscar por `voucher_code in codes`, buscar os `resend_id` conhecidos (dos eventos `sent` desses codes) e incluir eventos com `voucher_code null` mas `resend_id` conhecido. Implementação:

```ts
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
```

(Substitui a versão simples da Task 4.)

- [ ] **Step 3: Verificar**

Run: `npm run build`; simular:
`curl -i -X POST localhost:3000/api/webhooks/resend -H 'content-type: application/json' -d '{"type":"email.opened","data":{"email_id":"re_123","to":"x@y.com","tags":[{"name":"voucher_code","value":"WG-TEST-0001"}]}}'`
Expected (sem `RESEND_WEBHOOK_SECRET`): HTTP 200 `{ ok: true }`.

- [ ] **Step 4: Commit**

```bash
git add "app/api/webhooks/resend/route.ts" lib/store.ts
git commit -m "feat(email): webhook Resend grava delivered/opened/bounced"
```

---

### Task 7: Store — listagem e CRUD de leads/vouchers para o admin

**Files:**
- Modify: `lib/store.ts`

**Interfaces:**
- Produces:
  - `interface LeadWithVoucher { lead: Lead; voucher: Voucher | null }`
  - `listLeadsWithVouchers(): Promise<LeadWithVoucher[]>` (ordena por `lead.created_at` desc)
  - `updateLead(id: string, patch: Partial<Lead>): Promise<Lead | null>`
  - `deleteLead(id: string): Promise<boolean>`
  - `findLeadById(id: string): Promise<Lead | null>`

- [ ] **Step 1: Implementar as funções**

```ts
export interface LeadWithVoucher {
  lead: Lead;
  voucher: Voucher | null;
}

export async function listLeadsWithVouchers(): Promise<LeadWithVoucher[]> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data: leads } = await sb
      .from("winegarden_leads")
      .select("*")
      .order("created_at", { ascending: false });
    const { data: vouchers } = await sb.from("winegarden_vouchers").select("*");
    const vByLead = new Map<string, Voucher>();
    for (const v of (vouchers as Voucher[]) ?? []) {
      const prev = vByLead.get(v.lead_id);
      if (!prev || prev.created_at < v.created_at) vByLead.set(v.lead_id, v);
    }
    return ((leads as Lead[]) ?? []).map((lead) => ({
      lead,
      voucher: vByLead.get(lead.id) ?? null,
    }));
  }
  const leads = await readJson<Lead>(LEADS_FILE);
  const vouchers = await readJson<Voucher>(VOUCHERS_FILE);
  return leads
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((lead) => ({
      lead,
      voucher:
        vouchers
          .filter((v) => v.lead_id === lead.id)
          .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] ?? null,
    }));
}

export async function findLeadById(id: string): Promise<Lead | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data } = await sb
      .from("winegarden_leads")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Lead) ?? null;
  }
  const leads = await readJson<Lead>(LEADS_FILE);
  return leads.find((l) => l.id === id) ?? null;
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>
): Promise<Lead | null> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { data, error } = await sb
      .from("winegarden_leads")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as Lead) ?? null;
  }
  const leads = await readJson<Lead>(LEADS_FILE);
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...patch, id };
  await writeJson(LEADS_FILE, leads);
  return leads[idx];
}

export async function deleteLead(id: string): Promise<boolean> {
  const sb = getSupabaseAdmin();
  if (sb) {
    const { error } = await sb.from("winegarden_leads").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  }
  const leads = await readJson<Lead>(LEADS_FILE);
  const next = leads.filter((l) => l.id !== id);
  await writeJson(LEADS_FILE, next);
  // Cascata manual no fallback JSON:
  const vouchers = await readJson<Voucher>(VOUCHERS_FILE);
  await writeJson(
    VOUCHERS_FILE,
    vouchers.filter((v) => v.lead_id !== id)
  );
  return next.length !== leads.length;
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: compila.

- [ ] **Step 3: Commit**

```bash
git add lib/store.ts
git commit -m "feat(store): listagem com voucher + update/delete de lead"
```

---

### Task 8: APIs admin de voucher, resend e export

**Files:**
- Create: `app/api/admin/vouchers/[code]/route.ts`
- Create: `app/api/admin/resend/[code]/route.ts`
- Create: `app/api/admin/export/route.ts`

**Interfaces:**
- Consumes: `updateVoucher`, `findVoucherByCode`, `listLeadsWithVouchers`, `emailStatusByCodes`, `insertEmailEvent` de `lib/store`; `sendVoucherEmail` de `lib/mailer`; `glassLabel` de `lib/glasses`; `CAMPAIGN`, `VENUE` de `lib/config`.
- Produces: PATCH voucher (cancel/redeem/reactivate); POST resend; GET export CSV.

- [ ] **Step 1: `app/api/admin/vouchers/[code]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { findVoucherByCode, updateVoucher } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const voucher = await findVoucherByCode(code);
  if (!voucher) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (action === "cancel") {
    const v = await updateVoucher(code, { status: "cancelled" });
    return NextResponse.json({ voucher: v });
  }
  if (action === "reactivate") {
    const v = await updateVoucher(code, {
      status: "active",
      redeemed_at: null,
      redeemed_by: null,
    });
    return NextResponse.json({ voucher: v });
  }
  if (action === "redeem") {
    const v = await updateVoucher(code, {
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_by: "admin",
    });
    return NextResponse.json({ voucher: v });
  }
  return NextResponse.json({ error: "invalid_action" }, { status: 400 });
}
```

- [ ] **Step 2: `app/api/admin/resend/[code]/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  findLeadById,
  findVoucherByCode,
  insertEmailEvent,
} from "@/lib/store";
import { sendVoucherEmail } from "@/lib/mailer";
import { glassLabel } from "@/lib/glasses";
import { CAMPAIGN, VENUE } from "@/lib/config";
import { newId } from "@/lib/voucher";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const voucher = await findVoucherByCode(code);
  if (!voucher) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const lead = await findLeadById(voucher.lead_id);
  if (!lead?.email) {
    return NextResponse.json({ error: "no_email" }, { status: 422 });
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(
    /\/$/,
    ""
  );
  const r = await sendVoucherEmail(lead.email, {
    name: lead.name,
    glassName: glassLabel(voucher.selected_glass),
    code,
    validade: `${CAMPAIGN.courtesyPeriod.label} de 2026`,
    voucherUrl: voucher.qr_payload,
    qrUrl: `${base}/api/qr/${code}`,
    logoUrl: `${base}/brand/logo/wg-horizontal-bege.png`,
    mapsUrl: VENUE.mapsUrl,
  });

  if ("skipped" in r && r.skipped) {
    return NextResponse.json({ error: "email_not_configured" }, { status: 500 });
  }
  await insertEmailEvent({
    id: newId(),
    resend_id: "id" in r ? r.id ?? null : null,
    email: lead.email,
    voucher_code: code,
    type: "resent",
    created_at: new Date().toISOString(),
    raw: null,
  });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: `app/api/admin/export/route.ts`**

```ts
import { NextResponse } from "next/server";
import { emailStatusByCodes, listLeadsWithVouchers } from "@/lib/store";
import { glassLabel } from "@/lib/glasses";

export const runtime = "nodejs";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const rows = await listLeadsWithVouchers();
  const codes = rows.map((r) => r.voucher?.voucher_code).filter(Boolean) as string[];
  const status = await emailStatusByCodes(codes);

  const header = [
    "Nome", "Telefone", "Email", "CPF", "Taca", "Codigo",
    "StatusVoucher", "StatusEmail", "EnviadoEm", "AbertoEm", "CriadoEm",
  ];
  const lines = [header.join(";")];
  for (const { lead, voucher } of rows) {
    const st = voucher ? status[voucher.voucher_code] : undefined;
    lines.push(
      [
        lead.name, lead.phone, lead.email, lead.cpf,
        glassLabel(lead.selected_glass),
        voucher?.voucher_code ?? "",
        voucher?.status ?? "",
        st?.stage ?? "none",
        st?.sentAt ?? "",
        st?.openedAt ?? "",
        lead.created_at,
      ]
        .map(csvCell)
        .join(";")
    );
  }
  return new NextResponse("﻿" + lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="inscritos-winegarden.csv"',
    },
  });
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: compila. (As rotas exigem cookie `wg_admin` via middleware.)

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/vouchers app/api/admin/resend app/api/admin/export
git commit -m "feat(admin): APIs de voucher, reenvio de e-mail e export CSV"
```

---

### Task 9: APIs admin de leads (adicionar / editar / excluir)

**Files:**
- Create: `app/api/admin/leads/route.ts` (POST)
- Create: `app/api/admin/leads/[id]/route.ts` (PATCH, DELETE)

**Interfaces:**
- Consumes: validadores de `lib/voucher`, store (`insertLead`, `insertVoucher`, `updateLead`, `deleteLead`, `findLeadByPhone`, `findLeadByCpf`, `insertEmailEvent`), `sendVoucherEmail`, `glassById/glassLabel`, `CAMPAIGN/VENUE`.
- Produces: cria lead+voucher (reusa a lógica de `/api/voucher`); edita e exclui lead.

- [ ] **Step 1: `app/api/admin/leads/route.ts` (adicionar inscrito)**

Reaproveita a mesma validação/criação de `/api/voucher`. Como o admin cria em nome do usuário, aplicamos as mesmas regras.

```ts
import { NextRequest, NextResponse } from "next/server";
import {
  findLeadByCpf,
  findLeadByPhone,
  insertEmailEvent,
  insertLead,
  insertVoucher,
} from "@/lib/store";
import {
  buildQrPayload,
  defaultExpiry,
  generateVoucherCode,
  isAdult,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  newId,
  normalizeCpf,
  normalizePhone,
} from "@/lib/voucher";
import { glassById, glassLabel } from "@/lib/glasses";
import { CAMPAIGN, VENUE } from "@/lib/config";
import type { Lead, Voucher } from "@/lib/types";
import { sendVoucherEmail } from "@/lib/mailer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const rawPhone = String(body.phone ?? "").trim();
  const rawCpf = String(body.cpf ?? "").trim();
  const birth_date = String(body.birth_date ?? "").trim();
  const selected_glass = String(body.selected_glass ?? "").trim();
  const email = String(body.email ?? "").trim();

  if (name.length < 2) return NextResponse.json({ error: "invalid_name" }, { status: 422 });
  if (!isValidPhone(rawPhone)) return NextResponse.json({ error: "invalid_phone" }, { status: 422 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "invalid_email" }, { status: 422 });
  if (!isValidCpf(rawCpf)) return NextResponse.json({ error: "invalid_cpf" }, { status: 422 });
  if (!birth_date || !isAdult(birth_date)) return NextResponse.json({ error: "not_adult" }, { status: 422 });
  if (!glassById(selected_glass)) return NextResponse.json({ error: "invalid_glass" }, { status: 422 });

  const phone = normalizePhone(rawPhone);
  const cpf = normalizeCpf(rawCpf);
  if (await findLeadByPhone(phone)) return NextResponse.json({ error: "phone_already_registered" }, { status: 409 });
  if (await findLeadByCpf(cpf)) return NextResponse.json({ error: "cpf_already_registered" }, { status: 409 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const nowIso = new Date().toISOString();
  const lead: Lead = {
    id: newId(), name, phone, cpf, email, birth_date,
    has_visited_before: body.has_visited_before ? String(body.has_visited_before) : null,
    selected_glass, source: "admin",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_content: null, utm_term: null,
    created_at: nowIso,
  };
  const code = generateVoucherCode();
  const voucher: Voucher = {
    id: newId(), lead_id: lead.id, voucher_code: code,
    qr_payload: buildQrPayload(code, siteUrl), selected_glass,
    status: "active", expires_at: defaultExpiry(), created_at: nowIso,
    redeemed_at: null, redeemed_by: null,
  };
  await insertLead(lead);
  await insertVoucher(voucher);

  const base = siteUrl.replace(/\/$/, "");
  const r = await sendVoucherEmail(email, {
    name, glassName: glassLabel(selected_glass), code,
    validade: `${CAMPAIGN.courtesyPeriod.label} de 2026`,
    voucherUrl: voucher.qr_payload, qrUrl: `${base}/api/qr/${code}`,
    logoUrl: `${base}/brand/logo/wg-horizontal-bege.png`, mapsUrl: VENUE.mapsUrl,
  }).catch(() => null);
  if (r && "id" in r && r.id) {
    await insertEmailEvent({
      id: newId(), resend_id: r.id, email, voucher_code: code,
      type: "sent", created_at: new Date().toISOString(), raw: null,
    });
  }
  return NextResponse.json({ lead, voucher }, { status: 201 });
}
```

- [ ] **Step 2: `app/api/admin/leads/[id]/route.ts` (editar / excluir)**

```ts
import { NextRequest, NextResponse } from "next/server";
import { deleteLead, updateLead } from "@/lib/store";
import {
  isValidCpf,
  isValidEmail,
  isValidPhone,
  normalizeCpf,
  normalizePhone,
} from "@/lib/voucher";
import { glassById } from "@/lib/glasses";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

const EDITABLE = ["name", "phone", "cpf", "email", "birth_date", "selected_glass", "has_visited_before"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Partial<Lead> = {};

  for (const key of EDITABLE) {
    if (body[key] === undefined) continue;
    let val = String(body[key]).trim();
    if (key === "phone") {
      if (!isValidPhone(val)) return NextResponse.json({ error: "invalid_phone" }, { status: 422 });
      val = normalizePhone(val);
    }
    if (key === "cpf") {
      if (!isValidCpf(val)) return NextResponse.json({ error: "invalid_cpf" }, { status: 422 });
      val = normalizeCpf(val);
    }
    if (key === "email" && !isValidEmail(val)) return NextResponse.json({ error: "invalid_email" }, { status: 422 });
    if (key === "selected_glass" && !glassById(val)) return NextResponse.json({ error: "invalid_glass" }, { status: 422 });
    (patch as Record<string, unknown>)[key] = val;
  }

  const updated = await updateLead(id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ lead: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteLead(id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: compila.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/leads
git commit -m "feat(admin): APIs de adicionar/editar/excluir inscrito"
```

---

### Task 10: Página de login do admin e do operador

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/operador/login/page.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/[role]`.
- Produces: telas de login que setam o cookie e redirecionam para `/admin` ou `/operador`.

- [ ] **Step 1: Componente de login reutilizável e as duas páginas**

Criar `app/admin/login/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLogin() {
  return <LoginForm role="admin" title="Painel — Wine Garden" next="/admin" />;
}

export function LoginForm({ role, title, next }: { role: "admin" | "operator"; title: string; next: string }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch(`/api/auth/${role}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (!res.ok) { setErr("Senha inválida."); return; }
    router.push(sp.get("next") || next);
    router.refresh();
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--uva)", padding: 24 }}>
      <form onSubmit={submit} className="ticket" style={{ maxWidth: 380, width: "100%", padding: 30, background: "var(--offwhite)" }}>
        <span className="eyebrow" style={{ color: "var(--purpura)" }}>Acesso restrito</span>
        <h1 style={{ fontSize: "1.8rem", marginTop: 10, color: "var(--uva)" }}>{title}</h1>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha" autoFocus
          style={{ width: "100%", marginTop: 20, padding: "12px 14px", fontSize: 16 }}
        />
        {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
        <button className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

Criar `app/operador/login/page.tsx`:

```tsx
"use client";
import { LoginForm } from "@/app/admin/login/page";

export default function OperadorLogin() {
  return <LoginForm role="operator" title="Validação — Wine Garden" next="/operador" />;
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build`; `npm run dev`; abrir `/admin/login` e `/operador/login`.
Expected: formulário renderiza; senha correta redireciona; senha errada mostra erro.

- [ ] **Step 3: Commit**

```bash
git add app/admin/login app/operador/login
git commit -m "feat(auth): telas de login de admin e operador"
```

---

### Task 11: Página /operador (scanner de câmera + código)

**Files:**
- Create: `app/operador/page.tsx`

**Interfaces:**
- Consumes: `GET /api/voucher/[code]`, `POST /api/voucher/[code]` (`{action:"redeem", redeemed_by:"operador"}`), `glassLabel`.
- Produces: página de validação.

**Nota:** extrair código de um texto do QR — o payload é uma URL `.../validar/WG-XXXX-YYYY`. Regex `/(WG-[A-Z0-9]{4}-[A-Z0-9]{4})/i` cobre tanto URL quanto código puro.

- [ ] **Step 1: Implementar a página**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { glassLabel } from "@/lib/glasses";
import type { Voucher } from "@/lib/types";

function extractCode(text: string): string | null {
  const m = text.match(/(WG-[A-Z0-9]{4}-[A-Z0-9]{4})/i);
  return m ? m[1].toUpperCase() : null;
}

export default function Operador() {
  const [manual, setManual] = useState("");
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  async function lookup(code: string) {
    setBusy(true); setMsg(""); setVoucher(null);
    const res = await fetch(`/api/voucher/${code}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error === "not_found" ? "Convite não encontrado." : "Erro ao consultar."); return; }
    setVoucher(data.voucher);
  }

  async function redeem() {
    if (!voucher) return;
    setBusy(true);
    const res = await fetch(`/api/voucher/${voucher.voucher_code}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "redeem", redeemed_by: "operador" }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(
        data.error === "already_redeemed" ? "⚠️ Convite JÁ resgatado." :
        data.error === "expired" ? "Convite expirado." : "Não foi possível resgatar."
      );
      lookup(voucher.voucher_code);
      return;
    }
    setVoucher(data.voucher);
    setMsg("✅ Resgatado com sucesso!");
  }

  function stopScan() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }

  async function startScan() {
    const Detector = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector;
    if (!Detector) { setMsg("Câmera não suportada neste navegador. Use o código manual."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setScanning(true);
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (!streamRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const found = codes.map((c: any) => extractCode(c.rawValue)).find(Boolean);
          if (found) { stopScan(); await lookup(found); return; }
        } catch {}
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    } catch {
      setMsg("Não foi possível acessar a câmera.");
      setScanning(false);
    }
  }

  useEffect(() => () => stopScan(), []);

  const statusLabel: Record<string, string> = {
    active: "Ativo — pode resgatar", redeemed: "Já resgatado",
    expired: "Expirado", cancelled: "Cancelado",
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--uva)" }}>
      <div className="ticket" style={{ maxWidth: 460, width: "100%", padding: 30, background: "var(--offwhite)" }}>
        <span className="eyebrow" style={{ color: "var(--purpura)" }}>Validação — equipe Wine Garden</span>
        <h1 style={{ fontSize: "1.9rem", marginTop: 10, color: "var(--uva)" }}>Validar convite</h1>

        {scanning ? (
          <>
            <video ref={videoRef} playsInline style={{ width: "100%", borderRadius: 8, marginTop: 16, background: "#000" }} />
            <button className="btn" onClick={stopScan} style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>Parar câmera</button>
          </>
        ) : (
          <button className="btn" onClick={startScan} style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>📷 Ler QR pela câmera</button>
        )}

        <form onSubmit={(e) => { e.preventDefault(); const c = extractCode(manual) || manual.trim().toUpperCase(); if (c) lookup(c); }} style={{ marginTop: 16 }}>
          <input value={manual} onChange={(e) => setManual(e.target.value)} placeholder="Código (ex.: WG-XXXX-YYYY)"
            style={{ width: "100%", padding: "12px 14px", fontSize: 16 }} />
          <button className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>Consultar código</button>
        </form>

        {msg && <p className="body" style={{ marginTop: 16, fontWeight: 600, color: "var(--purpura)" }}>{msg}</p>}

        {voucher && (
          <div style={{ marginTop: 20 }}>
            <hr className="dotted" />
            <p className="mono-label" style={{ color: "var(--uva-70)", marginTop: 14 }}>Código</p>
            <p className="body">{voucher.voucher_code}</p>
            <p className="mono-label" style={{ color: "var(--uva-70)" }}>Taça</p>
            <p className="body">{glassLabel(voucher.selected_glass)}</p>
            <p className="mono-label" style={{ color: "var(--uva-70)" }}>Status</p>
            <p className="body" style={{ fontWeight: 600 }}>{statusLabel[voucher.status] ?? voucher.status}</p>
            {voucher.status === "active" && (
              <button className="btn" disabled={busy} onClick={redeem} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>
                {busy ? "Resgatando…" : "Resgatar convite"}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verificar**

Run: `npm run build`; `npm run dev`; logar em `/operador`; digitar um código existente → mostra status; resgatar → status vira "Já resgatado"; nova consulta do mesmo código + resgatar → mensagem "JÁ resgatado".
Expected: reuso bloqueado. Testar câmera em dispositivo com HTTPS/localhost.

- [ ] **Step 3: Commit**

```bash
git add app/operador/page.tsx
git commit -m "feat(operador): validação por câmera (BarcodeDetector) e código"
```

---

### Task 12: Página /admin — server + tabela client

**Files:**
- Create: `app/admin/page.tsx` (server)
- Create: `app/admin/AdminTable.tsx` (client)

**Interfaces:**
- Consumes: `listLeadsWithVouchers`, `emailStatusByCodes` de `lib/store`; `glassLabel`; APIs admin das Tasks 8 e 9.
- Produces: painel com busca, colunas, QR, badges de e-mail e ações.

- [ ] **Step 1: `app/admin/page.tsx` (server component)**

```tsx
import { emailStatusByCodes, listLeadsWithVouchers } from "@/lib/store";
import { glassLabel } from "@/lib/glasses";
import AdminTable, { AdminRow } from "./AdminTable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const list = await listLeadsWithVouchers();
  const codes = list.map((r) => r.voucher?.voucher_code).filter(Boolean) as string[];
  const status = await emailStatusByCodes(codes);

  const rows: AdminRow[] = list.map(({ lead, voucher }) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    cpf: lead.cpf,
    birth_date: lead.birth_date,
    glass: lead.selected_glass,
    glassName: glassLabel(lead.selected_glass),
    code: voucher?.voucher_code ?? null,
    voucherStatus: voucher?.status ?? null,
    email_status: voucher ? status[voucher.voucher_code] ?? { stage: "none" } : { stage: "none" },
    created_at: lead.created_at,
  }));

  return <AdminTable rows={rows} />;
}
```

- [ ] **Step 2: `app/admin/AdminTable.tsx` (client)**

Componente com busca, tabela, badges, QR e ações (editar inline via `prompt`/modal simples, excluir, cancelar/resgatar, reenviar, adicionar, export). Para manter o escopo enxuto e sem libs, edição usa um formulário inline expansível.

```tsx
"use client";
import { useMemo, useState } from "react";
import type { EmailStatus } from "@/lib/types";

export interface AdminRow {
  id: string;
  name: string; phone: string; email: string; cpf: string;
  birth_date: string; glass: string; glassName: string;
  code: string | null; voucherStatus: string | null;
  email_status: EmailStatus; created_at: string;
}

const emailBadge: Record<string, { label: string; color: string }> = {
  none: { label: "—", color: "#999" },
  sent: { label: "Enviado", color: "#414417" },
  resent: { label: "Reenviado", color: "#414417" },
  delivered: { label: "Entregue", color: "#2b6", },
  opened: { label: "Aberto", color: "#0a7" },
  bounced: { label: "Falhou", color: "#c33" },
  complained: { label: "Spam", color: "#c33" },
};

export default function AdminTable({ rows }: { rows: AdminRow[] }) {
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((r) =>
      [r.name, r.email, r.phone, r.cpf, r.code ?? ""].some((v) => v.toLowerCase().includes(t))
    );
  }, [q, rows]);

  async function call(url: string, method: string, body?: unknown) {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert("Erro: " + (d.error ?? res.status));
      return false;
    }
    return true;
  }

  async function act(fn: () => Promise<boolean>, id: string) {
    setBusyId(id);
    const ok = await fn();
    setBusyId(null);
    if (ok) location.reload();
  }

  return (
    <main style={{ padding: 24, background: "var(--uva)", minHeight: "100vh", color: "var(--offwhite)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontSize: "1.8rem" }}>Inscritos ({rows.length})</h1>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="btn" href="/api/admin/export">Exportar CSV</a>
          <button className="btn" onClick={() => (window.location.hash = "novo")}>+ Adicionar</button>
          <button className="btn" onClick={async () => { await fetch("/api/auth/admin", { method: "DELETE" }); location.href = "/admin/login"; }}>Sair</button>
        </div>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, e-mail, telefone, CPF ou código…"
        style={{ width: "100%", margin: "16px 0", padding: "12px 14px", fontSize: 16 }} />

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--uva-70)" }}>
              {["QR", "Nome", "Telefone", "E-mail", "CPF", "Taça", "Código", "Voucher", "E-mail", "Criado", "Ações"].map((h) => (
                <th key={h} style={{ padding: "8px 6px", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const badge = emailBadge[r.email_status.stage] ?? emailBadge.none;
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                  <td style={{ padding: "6px" }}>
                    {r.code && <a href={`/api/qr/${r.code}`} target="_blank" rel="noreferrer">
                      <img src={`/api/qr/${r.code}`} alt="QR" width={44} height={44} style={{ background: "#fff", borderRadius: 4 }} />
                    </a>}
                  </td>
                  <td style={{ padding: "6px" }}>{r.name}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>{r.phone}</td>
                  <td style={{ padding: "6px" }}>{r.email}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>{r.cpf}</td>
                  <td style={{ padding: "6px" }}>{r.glassName}</td>
                  <td style={{ padding: "6px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.code ?? "—"}</td>
                  <td style={{ padding: "6px" }}>{r.voucherStatus ?? "—"}</td>
                  <td style={{ padding: "6px", color: badge.color, fontWeight: 600 }} title={r.email_status.openedAt ?? r.email_status.sentAt ?? ""}>{badge.label}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  <td style={{ padding: "6px", whiteSpace: "nowrap" }}>
                    <RowActions r={r} busy={busyId === r.id} act={act} call={call} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <NewLeadForm />
    </main>
  );
}

function RowActions({ r, busy, act, call }: {
  r: AdminRow; busy: boolean;
  act: (fn: () => Promise<boolean>, id: string) => void;
  call: (url: string, method: string, body?: unknown) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: r.name, phone: r.phone, email: r.email, cpf: r.cpf });

  if (editing) {
    return (
      <div style={{ display: "grid", gap: 4, minWidth: 200 }}>
        {(["name", "phone", "email", "cpf"] as const).map((k) => (
          <input key={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            placeholder={k} style={{ padding: 4, fontSize: 12 }} />
        ))}
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/leads/${r.id}`, "PATCH", form), r.id)}>Salvar</button>
          <button className="btn" onClick={() => setEditing(false)}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      <button className="btn" onClick={() => setEditing(true)}>Editar</button>
      {r.code && <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/resend/${r.code}`, "POST"), r.id)}>Reenviar</button>}
      {r.code && r.voucherStatus !== "redeemed" && <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/vouchers/${r.code}`, "PATCH", { action: "redeem" }), r.id)}>Resgatar</button>}
      {r.code && r.voucherStatus !== "cancelled" && <button className="btn" disabled={busy} onClick={() => act(() => call(`/api/admin/vouchers/${r.code}`, "PATCH", { action: "cancel" }), r.id)}>Cancelar</button>}
      <button className="btn" disabled={busy} onClick={() => { if (confirm(`Excluir ${r.name}?`)) act(() => call(`/api/admin/leads/${r.id}`, "DELETE"), r.id); }}>Excluir</button>
    </div>
  );
}

function NewLeadForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", cpf: "", birth_date: "", selected_glass: "" });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const res = await fetch("/api/admin/leads", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form),
    });
    setBusy(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { alert("Erro: " + (d.error ?? res.status)); return; }
    location.reload();
  }
  return (
    <form id="novo" onSubmit={submit} style={{ marginTop: 40, padding: 20, background: "rgba(255,255,255,.06)", borderRadius: 8, maxWidth: 480 }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: 12 }}>Adicionar inscrito</h2>
      {(["name", "phone", "email", "cpf"] as const).map((k) => (
        <input key={k} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={k}
          style={{ width: "100%", marginBottom: 8, padding: "10px 12px" }} />
      ))}
      <input value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} placeholder="Nascimento (YYYY-MM-DD)" style={{ width: "100%", marginBottom: 8, padding: "10px 12px" }} />
      <input value={form.selected_glass} onChange={(e) => setForm({ ...form, selected_glass: e.target.value })} placeholder="ID da taça" style={{ width: "100%", marginBottom: 8, padding: "10px 12px" }} />
      <button className="btn" disabled={busy}>{busy ? "Criando…" : "Criar + enviar e-mail"}</button>
    </form>
  );
}
```

**Nota:** os IDs válidos de taça vêm de `lib/glasses.ts` (`glassById`). Ao integrar, considere trocar o input livre de "ID da taça" por um `<select>` populado com as opções reais — verificar `glasses.ts` durante a implementação e ajustar.

- [ ] **Step 3: Verificar**

Run: `npm run build`; `npm run dev`; logar em `/admin`.
Expected: tabela lista inscritos; busca filtra; QR aparece; ações editar/excluir/cancelar/resgatar/reenviar funcionam e refletem no banco após reload; "Adicionar" cria inscrito; "Exportar CSV" baixa arquivo.

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx app/admin/AdminTable.tsx
git commit -m "feat(admin): painel com busca, QR, status de e-mail e CRUD"
```

---

### Task 13: Documentar envs e migração; verificação end-to-end

**Files:**
- Create/Modify: `.env.example` (se não existir, criar)

**Interfaces:** nenhuma nova.

- [ ] **Step 1: Adicionar envs ao `.env.example`**

Adicionar (criar o arquivo se não existir):

```
# Painel admin / operador
ADMIN_PASSWORD=
OPERATOR_PASSWORD=
AUTH_SECRET=
# Webhook do Resend (Dashboard > Webhooks > Signing Secret)
RESEND_WEBHOOK_SECRET=
```

- [ ] **Step 2: Aplicar a migração no Supabase**

Rodar `supabase/migrations/0003_email_events.sql` no SQL Editor do Supabase (produção/staging). Registrar no PR que isso é manual.

- [ ] **Step 3: Configurar o webhook no Resend**

No dashboard do Resend, criar webhook apontando para `https://<SITE>/api/webhooks/resend` com os eventos `email.delivered`, `email.opened`, `email.bounced`, `email.complained`. Copiar o Signing Secret para `RESEND_WEBHOOK_SECRET`.

- [ ] **Step 4: Verificação end-to-end**

- Login admin e operador funcionam; middleware bloqueia sem cookie.
- Criar inscrito no `/admin` → e-mail enviado → linha aparece com "Enviado".
- Abrir o e-mail (ou simular webhook `email.opened`) → badge vira "Aberto".
- No `/operador`, ler o QR/código → resgatar → segunda tentativa bloqueada.
- Editar, excluir, cancelar, reenviar, exportar CSV.

- [ ] **Step 5: Commit**

```bash
git add .env.example
git commit -m "docs: envs do painel admin/operador e setup do webhook Resend"
```

---

## Self-Review

**Spec coverage:**
- Auth (senhas separadas) → Tasks 1–3, 10. ✓
- Tracking de e-mail (webhook) → Tasks 4–6. ✓
- Admin: busca, colunas, código, QR → Task 12. ✓
- Admin: editar/excluir/adicionar/persistir → Tasks 7, 9, 12. ✓
- Admin: cancelar/resgatar, reenviar, CSV → Tasks 8, 12. ✓
- Operador: câmera + código, bloqueio de reuso → Task 11. ✓

**Placeholders:** dois pontos exigem verificação na implementação, ambos sinalizados: (a) `<select>` de taça em `NewLeadForm` (checar `lib/glasses.ts`), (b) ajuste da assinatura de `sendVoucherEmail` conforme o corpo atual de `mailer.ts`. Nenhum "TODO" vazio.

**Type consistency:** `EmailStatus.stage`, `EmailEventType`, `LeadWithVoucher`, `AdminRow` consistentes entre store, APIs e UI. `emailStatusByCodes` redefinido na Task 6 (versão final substitui a da Task 4).
