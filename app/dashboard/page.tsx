import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function Dashboard() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, tenant_id')
    .single()

  const { data: tenant } = profile?.tenant_id
    ? await supabase
        .from('tenants')
        .select('name')
        .eq('id', profile.tenant_id)
        .single()
    : { data: null }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Bem-vindo ao seu Dashboard, {profile?.full_name}!
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Você está gerenciando a barbearia: <strong>{tenant?.name}</strong>
        </p>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="mt-8 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}
