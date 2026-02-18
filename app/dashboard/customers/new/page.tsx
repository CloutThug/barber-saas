import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import PhoneInput from '@/components/PhoneInput'

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

  if (!name) {
    throw new Error('O nome do cliente é obrigatório')
  }

  const { error: insertError } = await supabase.from('customers').insert({
    name,
    phone,
    tenant_id: profile.tenant_id,
  })

  if (insertError) {
    console.error('Erro ao cadastrar cliente:', insertError)
    throw new Error(`Erro ao cadastrar cliente: ${insertError.message}`)
  }

  revalidatePath('/dashboard/customers')
  redirect('/dashboard/customers')
}

export default async function NewCustomerPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Novo Cliente
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Cadastre um novo cliente na sua barbearia
        </p>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <form action={createCustomer} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Nome completo do cliente"
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          {/* Telefone com máscara */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Telefone
            </label>
            <PhoneInput
              name="phone"
              id="phone"
              className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-6">
            <Link
              href="/dashboard/customers"
              className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
