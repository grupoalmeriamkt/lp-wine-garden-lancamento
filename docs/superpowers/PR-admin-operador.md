# PR: Painel /admin + página /operador (validação de voucher)

**Branch:** `feat/admin-operador` → `main`

## Comando para abrir (quando o acesso for liberado)

```bash
git push -u origin feat/admin-operador
gh pr create --base main --head feat/admin-operador \
  --title "Painel /admin + página /operador (validação de voucher)" \
  --body-file docs/superpowers/PR-admin-operador.md
```

---

## Título
Painel /admin + página /operador (validação de voucher)

## Descrição

Adiciona um painel administrativo e uma página de validação para a campanha
"A primeira taça da nova fase".

### /admin — gestão dos inscritos
- Login por senha (cookie de sessão) e middleware de proteção.
- Busca por nome, e-mail, telefone, CPF ou código.
- Colunas com QR Code, status do voucher e **status do e-mail**
  (enviado / entregue / aberto / falhou), com horário.
- CRUD completo persistido no banco: adicionar, editar, excluir,
  cancelar/resgatar voucher, reenviar e-mail e **exportar CSV**.

### /operador — validação na entrada
- Leitura do QR pela **câmera** (BarcodeDetector) e por **código digitado**.
- Resgate protegido por login; **reuso bloqueado** (2ª tentativa → 409).

### Segurança / auth
- Cookie assinado com HMAC (Web Crypto); `AUTH_SECRET` **fail-closed** em produção.
- Resgatar/cancelar (`POST /api/voucher/[code]`) passa a **exigir login**
  (operador ou admin). A consulta (GET) e a criação pública de voucher seguem
  abertas. A página pública `/winegarden/validar` virou **apenas consulta**.

### Tracking de e-mail
- Webhook do Resend (`/api/webhooks/resend`) grava eventos numa tabela nova
  (`winegarden_email_events`), casando por `resend_id` / tag `voucher_code`.

## Como foi testado
Teste end-to-end (driver JSON local e prova no Supabase):
auth + middleware (307/401), criação de inscrito (201), edição + validação de
CPF (200/422), resgate pelo operador, **reuso bloqueado (409)**, cancelamento,
reenvio de e-mail (evento `resent`), export CSV (com BOM), e o novo guard de
autenticação do resgate (GET público 200, POST sem login 401, POST com login
200). Revisão final por agente dedicado corrigiu 1 crítico (AUTH_SECRET) e
minors (CSV injection, ordenação de status, webhook best-effort, etc.).

## ⚠️ Passos manuais antes do deploy
1. Aplicar no Supabase (SQL Editor): `supabase/migrations/0002_add_cpf.sql`
   **e** `supabase/migrations/0003_email_events.sql`.
2. Definir envs (ver `.env.example`): `ADMIN_PASSWORD`, `OPERATOR_PASSWORD`,
   `AUTH_SECRET`, `RESEND_WEBHOOK_SECRET`.
3. Cadastrar o webhook no Resend → `/api/webhooks/resend`
   (eventos: delivered, opened, bounced, complained) e copiar o Signing Secret
   para `RESEND_WEBHOOK_SECRET`.

## Observações / follow-ups (não bloqueantes)
- Token de sessão é estático por papel (senha compartilhada de evento): logout
  limpa só o cookie do cliente; trocar `AUTH_SECRET` invalida todas as sessões.
- Sem rate-limit no login (aceitável para o escopo do evento).
- `/admin` recarrega a página após cada mutação (UX simples, sem libs).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
