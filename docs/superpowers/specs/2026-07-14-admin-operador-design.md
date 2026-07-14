# Painel /admin + Página /operador — Design

**Data:** 2026-07-14
**Projeto:** Wine Garden — "A primeira taça da nova fase"

## Objetivo

Dar à organização (1) um painel `/admin` para gerir todos os inscritos e ver o
ciclo de vida do e-mail (enviado / entregue / aberto), e (2) uma página
`/operador` para validar o voucher por câmera ou código digitado, impedindo o
reuso do convite.

## Contexto existente

- Next.js 15 (App Router), React 19, TypeScript.
- Supabase (`getSupabaseAdmin`) com fallback para JSON local em `.data/`.
- Resend para e-mail (`lib/mailer.ts`, `lib/email.ts`).
- Vouchers com status `active | redeemed | expired | cancelled`
  (`winegarden_vouchers`), leads em `winegarden_leads`.
- Já existe `/winegarden/validar/[code]` + `GET/POST /api/voucher/[code]`
  (resgate com bloqueio de reuso). QR PNG estável em `/api/qr/[code]`.
- Paleta/estilos em `app/globals.css` (`--uva`, `--purpura`, `.btn`, `.ticket`).

## 1. Autenticação

Escopo pontual de evento → senha única por papel, sem Supabase Auth.

- `middleware.ts` protege `/admin/*`, `/operador/*` e as APIs `/api/admin/*`.
- Dois cookies httpOnly assinados por HMAC (Web Crypto, compatível com edge):
  `wg_admin` e `wg_operator`. Valor = `HMAC(AUTH_SECRET, role)`; o middleware
  recomputa e compara (constante).
- Login: `/admin/login` e `/operador/login` → `POST /api/auth/[role]` com a
  senha; compara com env e seta o cookie (30 dias). Logout limpa o cookie.
- Envs novas: `ADMIN_PASSWORD`, `OPERATOR_PASSWORD`, `AUTH_SECRET`.
- O operador **não** acessa `/admin` nem `/api/admin/*`.
- `lib/auth.ts`: `signRole(role)`, `verifyCookie(value, role)`,
  `requireRole(role)` para uso em route handlers server-side.

## 2. Tracking de e-mail (Resend webhook)

- Migração `0003_email_events.sql`:
  ```sql
  create table winegarden_email_events (
    id           uuid primary key default gen_random_uuid(),
    resend_id    text,
    email        text not null,
    voucher_code text,
    type         text not null,   -- sent|delivered|opened|bounced|complained|resent
    created_at   timestamptz not null default now(),
    raw          jsonb
  );
  create index on winegarden_email_events (voucher_code);
  create index on winegarden_email_events (resend_id);
  ```
- `mailer.ts.sendVoucherEmail` passa a: (a) tagear o envio com
  `tags: [{ name: "voucher_code", value: code }]`, (b) retornar o `id` do Resend.
- No envio (rota voucher + resend admin), grava evento `sent`/`resent` com
  `resend_id`, `email`, `voucher_code`.
- `POST /api/webhooks/resend`: valida assinatura svix com
  `RESEND_WEBHOOK_SECRET`; mapeia `email.delivered|opened|bounced|complained`
  para linhas de evento, casando pelo `resend_id` (fallback: `email`).
- `store.ts`:
  - `insertEmailEvent(evt)`
  - `emailStatusByCodes(codes[])` → `{ [code]: { stage, sentAt, deliveredAt, openedAt, bouncedAt } }`
    (stage = estágio mais avançado observado).
- Env nova: `RESEND_WEBHOOK_SECRET`.

## 3. Painel /admin

- `app/admin/page.tsx` (server): carrega leads + voucher + status de e-mail.
- `store.ts.listLeadsWithVouchers()` → junta lead + último voucher.
- Componente client `AdminTable`:
  - **Busca** (client-side) por nome / e-mail / telefone / CPF / código.
  - **Colunas:** Nome · Telefone · E-mail · CPF · Taça · Código · Status
    voucher · Status e-mail (badges enviado/entregue/aberto + horário) ·
    Criado em · QR (thumb `/api/qr/CODE`, clique amplia) · Ações.
- APIs admin (todas exigem cookie `wg_admin`):
  - `POST   /api/admin/leads` — adiciona inscrito → cria lead + voucher + envia e-mail.
  - `PATCH  /api/admin/leads/[id]` — edita campos do lead (persiste no banco).
  - `DELETE /api/admin/leads/[id]` — exclui lead (voucher cascateia via FK).
  - `PATCH  /api/admin/vouchers/[code]` — `{action: cancel|redeem|reactivate}`.
  - `POST   /api/admin/resend/[code]` — reenvia e-mail (grava evento `resent`).
  - `GET    /api/admin/export` — CSV de todos os inscritos + status.
- Store ganha `updateLead`, `deleteLead` (mais os já existentes).

## 4. Página /operador

- `app/operador/page.tsx` (client):
  - **Scanner de câmera** via `BarcodeDetector` nativo; se indisponível,
    mostra aviso e mantém o input manual como caminho principal.
  - **Input manual** do código do voucher.
  - Extrai o código do QR (URL `/winegarden/validar/[code]`) ou usa o texto digitado.
  - Consulta `GET /api/voucher/[code]`; exibe taça, validade, status.
  - Botão **Resgatar** → `POST` `{action:"redeem", redeemed_by:"operador"}`.
    Reuso bloqueado: segunda leitura retorna `already_redeemed` e a UI avisa.
- Reaproveita a rota de validação existente (sem duplicar lógica de resgate).

## Arquivos

**Novos:** `middleware.ts`, `lib/auth.ts`,
`app/admin/page.tsx`, `app/admin/login/page.tsx`, `app/admin/AdminTable.tsx`,
`app/operador/page.tsx`, `app/operador/login/page.tsx`,
`app/api/auth/[role]/route.ts`, `app/api/admin/leads/route.ts`,
`app/api/admin/leads/[id]/route.ts`, `app/api/admin/vouchers/[code]/route.ts`,
`app/api/admin/resend/[code]/route.ts`, `app/api/admin/export/route.ts`,
`app/api/webhooks/resend/route.ts`, `supabase/migrations/0003_email_events.sql`.

**Alterados:** `lib/store.ts`, `lib/mailer.ts`, `lib/types.ts`,
`app/api/voucher/route.ts` (grava evento `sent`).

## Fora de escopo (YAGNI)

- Gestão de múltiplos usuários/papéis além de admin+operador.
- Relatórios/gráficos analíticos (só a tabela + status).
- Edição do template de e-mail pelo painel.

## Critérios de sucesso

- Admin faz login, busca, vê o código/QR e o status de e-mail de cada inscrito.
- Admin adiciona, edita, exclui e cancela/resgata — refletido no banco.
- CSV exporta a lista completa.
- Operador valida por câmera e por código; um voucher só resgata uma vez.
