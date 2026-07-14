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
