import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { formatBR } from '@/lib/date'
import Link from 'next/link'
import { CancelSubscriptionButton } from './CancelSubscriptionButton'

async function cancelSubscription(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    throw new Error('Erro ao buscar perfil do usuário')
  }

  const subscriptionId = formData.get('subscription_id') as string
  if (!subscriptionId) {
    throw new Error('ID da assinatura não encontrado')
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('id', subscriptionId)
    .eq('tenant_id', profile.tenant_id)

  if (error) {
    console.error('Erro ao cancelar assinatura:', error)
    throw new Error(`Erro ao cancelar assinatura: ${error.message}`)
  }

  revalidatePath('/dashboard/subscriptions')
}

export default async function SubscriptionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return <div className="text-destructive">Erro: Tenant não encontrado</div>
  }

  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      status,
      next_billing_date,
      customers ( id, name, phone ),
      monthly_plans ( name, price, credits_per_month )
    `)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'active')
    .order('id')

  if (error) {
    console.error('Erro ao buscar assinaturas:', error)
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Mensalistas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie as assinaturas ativas dos seus clientes
          </p>
        </div>
        <Link
          href="/dashboard/customers"
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          + Nova Assinatura
        </Link>
      </div>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-card p-4 shadow">
          <p className="text-sm text-muted-foreground">Total de Mensalistas</p>
          <p className="text-2xl font-bold text-primary">{subscriptions?.length ?? 0}</p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow">
          <p className="text-sm text-muted-foreground">Receita Mensal</p>
          <p className="text-2xl font-bold text-foreground">
            {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              (subscriptions || []).reduce((sum, sub) => {
                const plan = sub.monthly_plans as { price: number } | null
                return sum + (plan?.price ?? 0)
              }, 0)
            )}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow">
          <p className="text-sm text-muted-foreground">Créditos Totais/Mês</p>
          <p className="text-2xl font-bold text-foreground">
            {(subscriptions || []).reduce((sum, sub) => {
              const plan = sub.monthly_plans as { credits_per_month: number } | null
              return sum + (plan?.credits_per_month ?? 0)
            }, 0)}
          </p>
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg bg-card shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cliente
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Telefone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Plano
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Valor
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Renovação
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {(subscriptions || []).map((sub) => {
              const customer = sub.customers as { id: string; name: string; phone: string | null } | null
              const plan = sub.monthly_plans as { name: string; price: number; credits_per_month: number } | null

              return (
                <tr key={sub.id} className="hover:bg-secondary transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    <Link
                      href={`/dashboard/customers/${customer?.id}`}
                      className="text-primary hover:text-primary/80 hover:underline"
                    >
                      {customer?.name ?? 'Cliente removido'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {customer?.phone
                      ? customer.phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
                      : 'Não informado'}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      {plan?.name ?? 'Plano removido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {plan
                      ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)
                      : '-'}
                    <span className="text-muted-foreground/70 ml-1 text-xs">
                      ({plan?.credits_per_month ?? 0} cortes)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {sub.next_billing_date
                      ? formatBR(sub.next_billing_date, "dd 'de' MMMM")
                      : 'Não definida'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <CancelSubscriptionButton subscriptionId={sub.id} customerName={customer?.name ?? 'este cliente'} onCancel={cancelSubscription} />
                  </td>
                </tr>
              )
            })}
            {(!subscriptions || subscriptions.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhum mensalista ativo. Acesse a página de{' '}
                  <Link href="/dashboard/customers" className="text-primary hover:underline">
                    Clientes
                  </Link>{' '}
                  para atribuir um plano.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}