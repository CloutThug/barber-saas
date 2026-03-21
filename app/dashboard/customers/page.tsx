import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

interface CustomerRow {
  id: string
  name: string
  phone: string | null
}

interface ActiveSubscriptionRow {
  customer_id: string
  status: string | null
  monthly_plans?: { name: string } | null
}

interface CustomersPageProps {
  searchParams?: Promise<{ status?: string }>
}

export default async function CustomersPage(props: CustomersPageProps) {
  const searchParams = await props.searchParams
  const statusParam = searchParams?.status
  const normalizedStatus =
    statusParam === 'mensalista' || statusParam === 'avulso' ? statusParam : 'all'
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao verificar usuário.</p>
      </div>
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.tenant_id) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao buscar informações do usuário.</p>
      </div>
    )
  }

  const tenantId = profile.tenant_id

  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('tenant_id', tenantId)
    .order('name')

  const { data: activeSubscriptions, error: subscriptionsError } = await supabase
    .from('subscriptions')
    .select('customer_id, status, monthly_plans ( name )')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  if (customersError || subscriptionsError) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao carregar clientes.</p>
      </div>
    )
  }

  const subscriptionByCustomer = new Map<string, ActiveSubscriptionRow>()

  ;(activeSubscriptions || []).forEach((subscription) => {
    subscriptionByCustomer.set(subscription.customer_id, subscription)
  })

  const filteredCustomers = (customers || []).filter((customer) => {
    const isSubscriber = subscriptionByCustomer.has(customer.id)

    if (normalizedStatus === 'mensalista') {
      return isSubscriber
    }

    if (normalizedStatus === 'avulso') {
      return !isSubscriber
    }

    return true
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie seus clientes e veja quem é mensalista
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Cadastrar Novo Cliente
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/customers"
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
            normalizedStatus === 'all'
              ? 'bg-primary/20 text-primary ring-primary/30'
              : 'bg-card text-muted-foreground ring-border hover:bg-secondary'
          }`}
        >
          Todos
        </Link>
        <Link
          href="/dashboard/customers?status=mensalista"
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
            normalizedStatus === 'mensalista'
              ? 'bg-primary/20 text-primary ring-primary/30'
              : 'bg-card text-muted-foreground ring-border hover:bg-secondary'
          }`}
        >
          Mensalista
        </Link>
        <Link
          href="/dashboard/customers?status=avulso"
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
            normalizedStatus === 'avulso'
              ? 'bg-muted text-muted-foreground ring-border'
              : 'bg-card text-muted-foreground ring-border hover:bg-secondary'
          }`}
        >
          Avulso
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-card shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Nome
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Telefone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card stagger-list">
            {(filteredCustomers as CustomerRow[] | null)?.map((customer) => {
              const subscription = subscriptionByCustomer.get(customer.id)
              const isSubscriber = Boolean(subscription)
              const planName = subscription?.monthly_plans?.name

              return (
                <tr key={customer.id} className="hover:bg-secondary transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="text-primary hover:text-primary/80 hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {customer.phone
                      ? customer.phone.replace(
                          /^(\d{2})(\d{5})(\d{4})$/,
                          '($1) $2-$3'
                        )
                      : 'Não informado'}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          isSubscriber
                            ? 'bg-primary/20 text-primary ring-primary/30'
                            : 'bg-muted text-muted-foreground ring-border'
                        }`}
                      >
                        {isSubscriber ? 'Mensalista' : 'Avulso'}
                      </span>
                      {isSubscriber && planName ? (
                        <span className="text-xs text-muted-foreground">
                          Plano: {planName}
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              )
            })}
            {filteredCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-6 py-8 text-center text-sm text-muted-foreground"
                >
                  Nenhum cliente encontrado para esse filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
