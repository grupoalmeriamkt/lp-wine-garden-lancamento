-- ============================================================
-- Wine Garden — Campanha "A primeira taça da nova fase"
-- Migração inicial: leads + vouchers
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Leads capturados pela LP
-- ------------------------------------------------------------
create table if not exists public.winegarden_leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text not null,
  email         text,
  birth_date    date not null,
  has_visited_before text,
  selected_glass text not null,
  source        text,
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  created_at    timestamptz not null default now()
);

-- Um convite por telefone (evita duplicidade)
create unique index if not exists winegarden_leads_phone_key
  on public.winegarden_leads (phone);

-- ------------------------------------------------------------
-- Vouchers gerados
-- ------------------------------------------------------------
do $$ begin
  create type winegarden_voucher_status as enum ('active', 'redeemed', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.winegarden_vouchers (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references public.winegarden_leads (id) on delete cascade,
  voucher_code   text not null unique,
  qr_payload     text not null,
  selected_glass text not null,
  status         winegarden_voucher_status not null default 'active',
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now(),
  redeemed_at    timestamptz,
  redeemed_by    text
);

create index if not exists winegarden_vouchers_status_idx
  on public.winegarden_vouchers (status);

-- ------------------------------------------------------------
-- RLS: apenas service-role escreve/lê (a LP usa service key no server)
-- ------------------------------------------------------------
alter table public.winegarden_leads    enable row level security;
alter table public.winegarden_vouchers enable row level security;
-- Nenhuma policy pública: acesso somente via service role (bypassa RLS).
