import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import PhoneInput from '@/components/PhoneInput'
import CustomerTypeSelector from '../[id]/CustomerTypeSelector'

async function createCustomer(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.tenant_id) {
    throw new Error('Erro ao buscar perfil do usuário')
  }

  const name = (formData.get('name') as string)?.trim()
  const rawPhone = (formData.get('phone') as string)?.trim() || null
  const phone = rawPhone ? rawPhone.replace(/\D/g, '') : null
  const customerType = formData.get('customer_type') as string
  const planId = formData.get('plan_id') as string

  if (!name) {
    throw new Error('O nome do cliente é obrigatório')
  }

  if (customerType === 'mensalista' && !planId) {
    throw new Error('Selecione um plano para o cliente mensalista')
  }

  // Cria o cliente
  const { data: customer, error: insertError } = await supabase
    .from('customers')
    .insert({
      name,
      phone,
      tenant_id: profile.tenant_id,
    })
    .select('id')
    .single()

  if (insertError || !customer) {
    console.error('Erro ao cadastrar cliente:', insertError)
    throw new Error(`Erro ao cadastrar cliente: ${insertError?.message}`)
  }

  // Se for mensalista, cria a subscription
  if (customerType === 'mensalista' && planId) {
    const { error: subError } = await supabase.from('subscriptions').insert({
      customer_id: customer.id,
      plan_id: planId,
      status: 'active',
      tenant_id: profile.tenant_id,
    })

    if (subError) {
      console.error('Erro ao criar assinatura:', subError)
    }
  }

  revalidatePath('/dashboard/customers')
  redirect('/dashboard/customers')
}

export default async function NewCustomerPage() {
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

  // Busca planos disponíveis para o seletor de tipo
  const { data: plans } = await supabase
    .from('monthly_plans')
    .select('id, name, price')
    .eq('tenant_id', profile?.tenant_id ?? '')
    .order('price', { ascending: true })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Novo Cliente
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cadastre um novo cliente na sua barbearia
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-card shadow">
        <form action={createCustomer} className="p-6 space-y-6">
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
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 bg-background text-foreground shadow-sm ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm"
            />
          </div>

          {/* Tipo de Cliente + Plano */}
          <CustomerTypeSelector
            plans={plans || []}
            defaultType="avulso"
            defaultPlanId=""
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
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
