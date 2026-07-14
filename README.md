# Wine Garden — LP "A primeira taça da nova fase"

Landing page de relançamento do Wine Garden. Convite premium editorial com
escolha de taça, geração de voucher com QR Code e captura de lead para CRM.

**Rota principal:** `/winegarden/primeira-taca`
**Validação (equipe):** `/winegarden/validar/[codigo]` (destino do QR Code)

## Stack
- Next.js 15 (App Router) + TypeScript
- CSS próprio com a identidade visual oficial (sem framework)
- Fontes locais: Instrument Serif (títulos) + JetBrains Mono (funcional)
- Persistência **dual**: Supabase quando configurado, senão fallback local em `.data/`
- QR Code gerado no server (`qrcode`)

## Rodar
```bash
npm install
npm run dev        # http://localhost:3000 → redireciona para a LP
```
Sem variáveis de ambiente, os leads/vouchers são gravados em `.data/*.json`
(modo demo). Para produção, configure o Supabase.

## Supabase (produção)
1. Rode a migração `supabase/migrations/0001_winegarden.sql` no seu projeto.
2. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` (usada apenas no server)
   - `NEXT_PUBLIC_SITE_URL` (base do payload do QR Code)
3. A camada em `lib/store.ts` passa a usar o Supabase automaticamente.

Tabelas: `winegarden_leads`, `winegarden_vouchers` (status: `active`,
`redeemed`, `expired`, `cancelled`).

## API
| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/voucher` | Cria lead + voucher. Valida telefone, maioridade e 1 convite por telefone. Retorna `qrDataUrl`. |
| GET  | `/api/voucher/[code]` | Busca voucher; expira on-read. |
| POST | `/api/voucher/[code]` | `{action:"redeem"}` resgata · `{action:"cancel"}` cancela. |
| POST | `/api/track` | Recebe eventos de tracking (encaminhe ao CRM). |

## Tracking
`lib/tracking.ts` captura UTMs (URL → sessionStorage) e dispara para o
`dataLayer` (GTM/GA4) + `/api/track`. Eventos: `lp_view`, `hero_cta_click`,
`glass_selected`, `form_started`, `form_submitted`, `voucher_created`,
`maps_click`, `whatsapp_click`, `reservation_click`, `voucher_redeemed`.

## Antes do go-live
- Ajustar dados reais da casa em `lib/config.ts` (endereço, WhatsApp, Maps, Instagram).
- Instalar o snippet do GTM/GA4 no `app/layout.tsx` se for usar `dataLayer`.
- Configurar Supabase + `NEXT_PUBLIC_SITE_URL` no ambiente da Vercel.
