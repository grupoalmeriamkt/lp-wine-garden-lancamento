-- ============================================================
-- Wine Garden — adiciona CPF ao lead
-- Rode isto no SQL Editor do Supabase antes de habilitar o CPF em produção.
-- ============================================================

alter table public.winegarden_leads
  add column if not exists cpf text;

-- Opcional: garantir 1 cadastro por CPF (além do telefone)
create unique index if not exists winegarden_leads_cpf_key
  on public.winegarden_leads (cpf)
  where cpf is not null;
