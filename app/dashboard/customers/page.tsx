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
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao verificar usuario.</p>
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
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao buscar informacoes do usuario.</p>
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
      <div className="bg-white rounded-lg shadow p-6">
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
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie seus clientes e veja quem e mensalista
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          Cadastrar Novo Cliente
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href="/dashboard/customers"
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
            normalizedStatus === 'all'
              ? 'bg-indigo-100 text-indigo-700 ring-indigo-200'
              : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          Todos
        </Link>
        <Link
          href="/dashboard/customers?status=mensalista"
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
            normalizedStatus === 'mensalista'
              ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
              : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          Mensalista
        </Link>
        <Link
          href="/dashboard/customers?status=avulso"
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset transition-colors ${
            normalizedStatus === 'avulso'
              ? 'bg-gray-100 text-gray-700 ring-gray-200'
              : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'
          }`}
        >
          Avulso
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Nome
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Telefone
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {(filteredCustomers as CustomerRow[] | null)?.map((customer) => {
              const subscription = subscriptionByCustomer.get(customer.id)
              const isSubscriber = Boolean(subscription)
              const planName = subscription?.monthly_plans?.name

              return (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="text-indigo-600 hover:text-indigo-900 hover:underline"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {customer.phone
                      ? customer.phone.replace(
                          /^(\d{2})(\d{5})(\d{4})$/,
                          '($1) $2-$3'
                        )
                      : 'Não informado'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                          isSubscriber
                            ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                            : 'bg-gray-100 text-gray-700 ring-gray-200'
                        }`}
                      >
                        {isSubscriber ? 'Mensalista' : 'Avulso'}
                      </span>
                      {isSubscriber && planName ? (
                        <span className="text-xs text-gray-500">
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
                  className="px-6 py-8 text-center text-sm text-gray-500"
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
