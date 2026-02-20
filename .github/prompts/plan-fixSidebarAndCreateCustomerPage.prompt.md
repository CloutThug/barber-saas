## Plan: Corrigir sidebar + criar página de cadastro de cliente

A página de clientes já está funcional, mas o sidebar linka para uma rota errada e a página de cadastro referenciada não existe. Este plano resolve ambos.

**Steps**

1. **Corrigir links do sidebar** em [app/dashboard/layout.tsx](app/dashboard/layout.tsx): alterar todas as ocorrências de `/dashboard/clientes` para `/dashboard/customers` (aparece 2 vezes — [linha 51](app/dashboard/layout.tsx#L51) no mobile e [linha 101](app/dashboard/layout.tsx#L101) no desktop). Opcionalmente, corrigir também `/dashboard/servicos` se houver rota correspondente.

2. **Criar diretório** `app/dashboard/customers/new/`

3. **Criar** `app/dashboard/customers/new/page.tsx` seguindo exatamente o padrão de [app/dashboard/appointments/new/page.tsx](app/dashboard/appointments/new/page.tsx):
   - **Imports**: `createClient` de `@/lib/supabase-server`, `redirect` de `next/navigation`, `revalidatePath` de `next/cache`, `Link` de `next/link`
   - **Server Action inline** `createCustomer(formData: FormData)` com `'use server'`:
     - Autenticação: `supabase.auth.getUser()` → buscar `profile.tenant_id`
     - Extrair `name` (obrigatório) e `phone` (opcional) de `formData`
     - Validar que `name` não está vazio; se vazio, lançar erro
     - Inserir em `customers` com `{ name, phone: phone || null, tenant_id }`
     - Chamar `revalidatePath('/dashboard/customers')` + `redirect('/dashboard/customers')`
   - **Page component** (server component, sem `'use client'`):
     - Header: título "Novo Cliente", subtítulo "Cadastre um novo cliente"
     - Formulário `<form action={createCustomer}>` com:
       - Campo `name`: `<input type="text" name="name" required>` — label "Nome"
       - Campo `phone`: `<input type="tel" name="phone">` — label "Telefone"
     - Botões: "Cadastrar" (submit, `bg-indigo-600`) + "Cancelar" (`<Link>` para `/dashboard/customers`)
   - **Estilo**: mesmo padrão Tailwind da página de agendamentos — `bg-white rounded-lg shadow p-6`, inputs com `ring-1 ring-inset ring-gray-300 rounded-md`, `space-y-6` no form

**Verification**
- Clicar em "Clientes" no sidebar → deve navegar para `/dashboard/customers` (não 404)
- Na página de clientes, clicar "Cadastrar Novo Cliente" → deve abrir o formulário
- Preencher nome + telefone e submeter → cliente aparece na lista
- Submeter sem nome → erro de validação
- `revalidatePath` garante que a lista é atualizada após cadastro

**Decisions**
- Seguir padrão Server Action inline (como `appointments/new`) ao invés de API Routes ou `'use client'` — mantém consistência
- Apenas dois campos no formulário (`name`, `phone`) — são os únicos campos editáveis pelo usuário na tabela `customers` (`id`, `tenant_id`, `created_at` são gerados automaticamente)
- Adicionar mais informações do cliente (email, endereço)
- Redirecionar para `/dashboard/customers` após sucesso (ao invés de mostrar mensagem na mesma página)
