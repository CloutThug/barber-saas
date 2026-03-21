import { createClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import PhoneInput from '@/components/PhoneInput'
import CustomerTypeSelector from './CustomerTypeSelector'

async function updateCustomer(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const customerId = formData.get('customer_id') as string
  const name = (formData.get('name') as string)?.trim()
  const rawPhone = (formData.get('phone') as string)?.trim() || null
  const phone = rawPhone ? rawPhone.replace(/\D/g, '') : null
  const customerType = formData.get('customer_type') as string
  const planId = formData.get('plan_id') as string | null

  if (!name) {
    throw new Error('O nome do cliente é obrigatório')
  }

  if (!customerId) {
    throw new Error('ID do cliente não encontrado')
  }

  // Atualiza dados do cliente
  const { error: updateError } = await supabase
    .from('customers')
    .update({ name, phone })
    .eq('id', customerId)
    .eq('tenant_id', profile.tenant_id)

  if (updateError) {
    console.error('Erro ao atualizar cliente:', updateError)
    throw new Error(`Erro ao atualizar cliente: ${updateError.message}`)
  }

  // Gerencia assinatura
  if (customerType === 'mensalista' && planId) {
    // Valida que o plano pertence ao tenant
    const { data: plan, error: planError } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('id', planId)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (planError || !plan) {
      if (planError) {
        console.error('Erro ao validar plano:', planError)
        throw new Error('Plano não encontrado')
      }
      throw new Error('Plano não pertence a este tenant')
    }

    // Verifica se já existe assinatura ativa
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('customer_id', customerId)
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'active')
      .maybeSingle()

    if (existingSub) {
      // Atualiza assinatura existente
      await supabase
        .from('subscriptions')
        .update({ plan_id: planId })
        .eq('id', existingSub.id)
        .eq('tenant_id', profile.tenant_id)
    } else {
      // Cria nova assinatura
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          customer_id: customerId,
          plan_id: planId,
          status: 'active',
          tenant_id: profile.tenant_id,
        })

      if (subError) {
        console.error('Erro ao criar assinatura:', subError)
        throw new Error(`Erro ao criar assinatura: ${subError.message}`)
      }
    }
  } else if (customerType === 'avulso') {
    // Remove assinatura ativa (marca como canceled)
    await supabase
      .from('subscriptions')
      .update({ status: 'canceled' })
      .eq('customer_id', customerId)
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'active')
  }

  revalidatePath('/dashboard/customers')
  redirect('/dashboard/customers')
}

interface EditCustomerPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCustomerPage(props: EditCustomerPageProps) {
  const { id } = await props.params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao buscar informações do usuário.</p>
      </div>
    )
  }

  // Busca dados do cliente, assinatura ativa e planos em paralelo
  const [customerResult, subscriptionResult, plansResult] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, phone')
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single(),
    supabase
      .from('subscriptions')
      .select('id, plan_id, status')
      .eq('customer_id', id)
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('monthly_plans')
      .select('id, name, price')
      .eq('tenant_id', profile.tenant_id)
      .order('name'),
  ])

  if (customerResult.error || !customerResult.data) {
    notFound()
  }

  const customer = customerResult.data
  const activeSubscription = subscriptionResult.data
  const plans = plansResult.data || []

  const currentType = activeSubscription ? 'mensalista' : 'avulso'
  const currentPlanId = activeSubscription?.plan_id || ''

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Editar Cliente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Atualize os dados e o tipo de assinatura do cliente
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-card shadow">
        <form action={updateCustomer} className="p-6 space-y-6">
          <input type="hidden" name="customer_id" value={customer.id} />

          {/* Nome */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-muted-foreground"
            >
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={customer.name}
              placeholder="Nome completo do cliente"
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm"
            />
          </div>

          {/* Telefone com máscara */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-muted-foreground"
            >
              Telefone
            </label>
            <PhoneInput
              name="phone"
              id="phone"
              defaultValue={customer.phone}
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm"
            />
          </div>

          {/* Tipo de Cliente + Plano */}
          <CustomerTypeSelector
            plans={plans}
            defaultType={currentType}
            defaultPlanId={currentPlanId}
          />

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
            <Link
              href="/dashboard/customers"
              className="rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
