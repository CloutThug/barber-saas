# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**barber-saas** is a multi-tenant barbershop management SaaS. The UI is entirely in Brazilian Portuguese (pt-BR). All user-facing text (labels, error messages, placeholders) must be written in Portuguese.

## Tech Stack

- **Next.js 16** (App Router) with React 19 and TypeScript (strict mode)
- **Supabase** for auth, Postgres database, and Deno-based Edge Functions
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **date-fns** for date manipulation (uses `ptBR` locale)
- Path alias: `@/*` maps to the `barber-saas/` root
## Design System & UI
- **Library**: shadcn/ui (New York style, Slate base color)
- **Visual Style**: Interface limpa, sombras sutis (`shadow-sm`), bordas arredondadas padrão do shadcn.
- **Inspiration**: BarberLaB (estética moderna de barbearia).
- **Icons**: Lucide React.

## Build, Dev & Lint Commands

All commands run from `barber-saas/`:

```
npm run dev          # Start Next.js dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint (Next.js core-web-vitals + TypeScript rules)
```

## Supabase Commands

```
npm run supabase:login       # Login with access token
npm run supabase:link        # Link to remote project
npm run supabase:gen-types   # Regenerate types/supabase.ts from remote schema
npm run supabase:db          # Connect to remote DB via psql
npm run debug:appointments   # Debug script for appointments table
```

Migrations live in `supabase/migrations/`. Edge Functions live in `supabase/functions/` and use Deno imports.

## Architecture

### Multi-Tenant Data Model

Every entity is scoped by `tenant_id`. The data isolation chain is:

1. **Supabase Auth** authenticates the user
2. **profiles** table links `user.id` → `tenant_id`
3. All data tables (`customers`, `services`, `appointments`, `subscriptions`, `monthly_plans`, `customer_credits`, `credit_transactions`) have a `tenant_id` foreign key
4. **Row Level Security (RLS)** policies use the `is_my_tenant(row_tenant_id)` database function to enforce isolation

The common pattern in every page/action to get the tenant scope is:
```
const { data: { user } } = await supabase.auth.getUser()
const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
const tenantId = profile.tenant_id
```

### Supabase Client Setup

Two client factories in `lib/`:
- **`lib/supabase-server.ts`** — for Server Components and Server Actions. Uses `cookies()` from `next/headers` (must be `await`ed in Next.js 16). Returns a typed `Database` client.
- **`lib/supabase-browser.ts`** — for Client Components (`'use client'`). Uses `createBrowserClient`.

Always import from `@/lib/supabase-server` in server contexts and `@/lib/supabase-browser` in client contexts.

### Database Schema (key tables)

- **tenants** — barbershop businesses (name, slug, default_appointment_time)
- **profiles** — links auth users to tenants (id = auth user id, tenant_id, role)
- **customers** — barbershop clients (name, phone, tenant_id)
- **services** — offered services (name, price, duration_minutes, tenant_id)
- **appointments** — scheduled bookings (customer_id, service_id, scheduled_at, status, used_credit, tenant_id). Status values: `scheduled`, `canceled`, `done`
- **monthly_plans** — subscription plan definitions (name, price, credits_per_month, tenant_id)
- **subscriptions** — customer plan subscriptions (customer_id, plan_id, status, next_billing_date, tenant_id). Status: `active`, `canceled`
- **customer_credits** / **credit_transactions** — credit system for subscription-based usage

Database RPC functions: `buy_credit_package`, `create_appointment_with_credits`, `is_my_tenant`.

Auto-generated types are in `types/supabase.ts` — regenerate with `npm run supabase:gen-types` after schema changes.

### Routing & Page Structure

Uses Next.js App Router (`app/` directory):

- `/` — Landing/test page
- `/login` — Client Component with login/signup tabs (email+password auth)
- `/auth/callback` — OAuth callback route handler
- `/auth/signout` — POST route handler for sign-out
- `/dashboard` — Protected layout (redirects to `/login` if unauthenticated). Contains sidebar navigation.
  - `/dashboard` — Calendar view (monthly agenda)
  - `/dashboard/day/[date]` — Daily schedule with hourly time slots
  - `/dashboard/appointments/new` — New appointment form (accepts `?date=` and `?time=` query params)
  - `/dashboard/customers` — Customer list with status filters (`?status=mensalista|avulso`)
  - `/dashboard/customers/new` — New customer form
  - `/dashboard/customers/[id]` — Edit customer + manage subscription type
  - `/dashboard/settings/plans` — CRUD for monthly plans

### Auth Flow

- **Login**: Client-side via `supabase.auth.signInWithPassword()` in `app/login/page.tsx`
- **Signup**: Passes `full_name` and `tenant_name` in `user_metadata`; the `create-tenant` Edge Function (triggered on user creation) auto-creates the tenant and profile
- **Protection**: `app/dashboard/layout.tsx` checks auth server-side and redirects. `proxy.ts` contains middleware-style auth logic.
- **Signout**: POST to `/auth/signout`

### Patterns & Conventions

- **Server Actions** (`'use server'`) are used for all mutations (create/update/delete). They are defined as standalone `async function` in the same file as the page that uses them.
- **Server Components** (default) for all pages — data fetching happens at the component level using `await`.
- **Client Components** are marked with `'use client'` and used only when interactivity is needed (e.g., `LoginForm`, `PhoneInput`, `CustomerTypeSelector`).
- After mutations, use `revalidatePath()` then `redirect()`.
- Currency is displayed as `R$` (Brazilian Real), formatted with comma as decimal separator.
- Phone numbers are stored as digits only, displayed with mask `(XX) XXXXX-XXXX`.

## Multi-tenancy Rules
- **RLS**: Todas as tabelas possuem RLS habilitado.
- **Tenant ID**: O `tenant_id` é obrigatório em TODAS as operações de `INSERT` e `UPDATE`.
- **is_my_tenant()**: Use a função SQL `public.is_my_tenant(tenant_id)` nas políticas do Supabase.
- **Data Fetching**: Sempre busque o `tenant_id` através do perfil do usuário logado (`profiles`) antes de realizar consultas que dependam de contexto de loja.

## Subscription Logic (Mensalistas)
- **Flow**: Um `customer` torna-se mensalista quando possui um registro ativo na tabela `subscriptions`.
- **Plans**: As assinaturas devem estar vinculadas a um `monthly_plan` que define o preço e o limite de cortes (`credits_per_month`).
- **Validation**: Antes de definir um cliente como mensalista, verifique se a barbearia possui planos cadastrados em `monthly_plans`.

## UI Patterns & Validation
- **Phone Mask**: Use obrigatoriamente o padrão brasileiro `(XX) XXXXX-XXXX` em inputs de telefone. Salve apenas números no banco.
- **Date Display**: Use `date-fns` com o locale `ptBR` para formatar datas no calendário e na visão diária.
- **Currency**: Valores monetários em `R$`, formatados com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.


## Future Features Roadmap
1. **Service CRUD**: Gestão de preços e tempos de duração dos cortes.
2. **Credit Usage**: Checkbox no agendamento para debitar saldo do mensalista.
3. **Daily View Details**: Visão estilo Google Agenda (slots de horários verticais).
4. **WhatsApp Integration**: Geração de links `wa.me` para confirmação de agendamentos.