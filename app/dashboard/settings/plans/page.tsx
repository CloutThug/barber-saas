import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { DeletePlanButton } from './DeletePlanButton'

interface PlanRow {
  id: string
  name: string
  price: number
  credits_per_month: number
}

// Server Action para criar plano
async function createPlan(formData: FormData) {
  'use server'

  try {
    const supabase = await createClient()

    // Verifica usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
    }

    // Busca tenant_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.tenant_id) {
      throw new Error('Erro ao buscar perfil do usuário')
    }

    // Extrai e valida dados do formulário
    const name = (formData.get('name') as string)?.trim()
    const priceStr = (formData.get('price') as string)?.trim()
    const creditsStr = (formData.get('credits_per_month') as string)?.trim()

    if (!name) {
      throw new Error('Nome do plano é obrigatório')
    }

    if (!priceStr) {
      throw new Error('Valor mensal é obrigatório')
    }

    if (!creditsStr) {
      throw new Error('Quantidade de créditos é obrigatória')
    }

    const price = parseFloat(priceStr)
    const credits_per_month = parseInt(creditsStr)

    if (isNaN(price) || price <= 0) {
      throw new Error('Valor mensal deve ser maior que zero')
    }

    if (isNaN(credits_per_month) || credits_per_month <= 0) {
      throw new Error('Quantidade de créditos deve ser maior que zero')
    }

    // Insere novo plano
    const { error: insertError } = await supabase
      .from('monthly_plans')
      .insert({
        name,
        price,
        credits_per_month,
        tenant_id: profile.tenant_id,
      })

    if (insertError) {
      console.error('Erro ao criar plano:', insertError)
      throw new Error(`Erro ao criar plano: ${insertError.message}`)
    }

    revalidatePath('/dashboard/settings/plans')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[createPlan] Erro:', errorMessage)
    throw err
  }
}

// Server Action para deletar plano
async function deletePlan(formData: FormData) {
  'use server'

  try {
    const supabase = await createClient()

    // Verifica usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
    }

    // Busca tenant_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.tenant_id) {
      throw new Error('Erro ao buscar perfil do usuário')
    }

    const planId = formData.get('plan_id') as string
    if (!planId) {
      throw new Error('ID do plano não encontrado')
    }

    // Verifica se há subscriptions ativas com este plano
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('plan_id', planId)
      .eq('status', 'active')

    if (subError) {
      throw new Error(`Erro ao verificar subscriptions: ${subError.message}`)
    }

    if (subscriptions && subscriptions.length > 0) {
      throw new Error('Não é possível deletar um plano com clientes ativos. Cancele as subscriptions primeiro.')
    }

    // Deleta o plano
    const { error: deleteError } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', planId)
      .eq('tenant_id', profile.tenant_id)

    if (deleteError) {
      console.error('Erro ao deletar plano:', deleteError)
      throw new Error(`Erro ao deletar plano: ${deleteError.message}`)
    }

    revalidatePath('/dashboard/settings/plans')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[deletePlan] Erro:', errorMessage)
    throw err
  }
}

export default async function PlansPage() {
  const supabase = await createClient()

  // Verifica usuário logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Busca tenant_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return <div>Erro: Tenant não encontrado</div>
  }

  // Busca planos do tenant
  const { data: plans, error: plansError } = await supabase
    .from('monthly_plans')
    .select('id, name, price, credits_per_month')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  // Busca subscriptions ativas para cada plano
  const { data: subscriptions, error: subsError } = await supabase
    .from('subscriptions')
    .select('plan_id')
    .eq('status', 'active')

  if (plansError) {
    console.error('Erro ao buscar planos:', plansError)
  }

  if (subsError) {
    console.error('Erro ao buscar subscriptions:', subsError)
  }

  // Conta subscriptions por plano
  const subscriptionCountByPlan = new Map<string, number>()
  ;(subscriptions || []).forEach((sub) => {
    if (sub.plan_id) {
      const count = subscriptionCountByPlan.get(sub.plan_id) || 0
      subscriptionCountByPlan.set(sub.plan_id, count + 1)
    }
  })

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Planos Mensais
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie os planos de assinatura mensal para seus clientes
        </p>
      </div>

      {/* Formulário para criar novo plano */}
      <div className="mb-8 overflow-hidden rounded-lg bg-card shadow">
        <div className="border-b border-border bg-secondary px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Novo Plano</h2>
        </div>
        <form action={createPlan} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Nome do Plano */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-foreground">
                Nome do Plano <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Ex: Plano Prata"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              />
            </div>

            {/* Valor Mensal */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium leading-6 text-foreground">
                Valor Mensal (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                step="0.01"
                min="0"
                placeholder="99.90"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              />
            </div>

            {/* Créditos por Mês */}
            <div>
              <label htmlFor="credits_per_month" className="block text-sm font-medium leading-6 text-foreground">
                Créditos/Cortes por Mês <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="credits_per_month"
                name="credits_per_month"
                required
                min="1"
                placeholder="4"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Criar Plano
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Planos */}
      <div className="overflow-hidden rounded-lg bg-card shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Valor Mensal
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Créditos/Mês
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Clientes Ativos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {(plans as PlanRow[] | null)?.map((plan) => {
              const activeCount = subscriptionCountByPlan.get(plan.id) || 0
              const canDelete = activeCount === 0

              return (
                <tr key={plan.id} className="hover:bg-secondary transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {plan.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {plan.credits_per_month} créditos
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      activeCount > 0
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {activeCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {canDelete ? (
                      <DeletePlanButton planId={plan.id} planName={plan.name} onDelete={deletePlan} />
                    ) : (
                      <span className="text-muted-foreground cursor-not-allowed text-xs" title="Não pode deletar plano com clientes ativos">
                        Plano em uso
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!plans || plans.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhum plano cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
