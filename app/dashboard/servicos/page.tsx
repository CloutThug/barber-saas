import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { DeleteServiceButton } from './DeleteServiceButton'

async function createService(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
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
  const priceStr = (formData.get('price') as string)?.trim()
  const durationStr = (formData.get('duration_minutes') as string)?.trim()

  if (!name) {
    throw new Error('Nome do serviço é obrigatório')
  }

  if (!priceStr) {
    throw new Error('Preço é obrigatório')
  }

  const price = parseFloat(priceStr)
  if (isNaN(price) || price <= 0) {
    throw new Error('Preço deve ser maior que zero')
  }

  const duration_minutes = durationStr ? parseInt(durationStr) : null
  if (duration_minutes !== null && (isNaN(duration_minutes) || duration_minutes <= 0)) {
    throw new Error('Duração deve ser maior que zero')
  }

  const { error: insertError } = await supabase
    .from('services')
    .insert({
      name,
      price,
      duration_minutes,
      tenant_id: profile.tenant_id,
    })

  if (insertError) {
    console.error('Erro ao criar serviço:', insertError)
    throw new Error(`Erro ao criar serviço: ${insertError.message}`)
  }

  revalidatePath('/dashboard/servicos')
}

async function deleteService(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
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

  const serviceId = formData.get('service_id') as string
  if (!serviceId) {
    throw new Error('ID do serviço não encontrado')
  }

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id')
    .eq('service_id', serviceId)
    .eq('status', 'scheduled')

  if (appointments && appointments.length > 0) {
    throw new Error('Não é possível deletar um serviço com agendamentos pendentes.')
  }

  const { error: deleteError } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)
    .eq('tenant_id', profile.tenant_id)

  if (deleteError) {
    console.error('Erro ao deletar serviço:', deleteError)
    throw new Error(`Erro ao deletar serviço: ${deleteError.message}`)
  }

  revalidatePath('/dashboard/servicos')
}

export default async function ServicosPage() {
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

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  // Conta agendamentos pendentes por serviço
  const { data: pendingAppointments } = await supabase
    .from('appointments')
    .select('service_id')
    .eq('status', 'scheduled')

  const appointmentCountByService = new Map<string, number>()
  ;(pendingAppointments || []).forEach((apt) => {
    if (apt.service_id) {
      const count = appointmentCountByService.get(apt.service_id) || 0
      appointmentCountByService.set(apt.service_id, count + 1)
    }
  })

  if (servicesError) {
    console.error('Erro ao buscar serviços:', servicesError)
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Serviços
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gerencie os serviços oferecidos pela sua barbearia
        </p>
      </div>

      {/* Formulário para criar novo serviço */}
      <div className="mb-8 overflow-hidden rounded-lg bg-card shadow">
        <div className="border-b border-border bg-secondary px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Novo Serviço</h2>
        </div>
        <form action={createService} className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-foreground">
                Nome do Serviço <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="Ex: Corte Degradê"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              />
            </div>

            {/* Preço */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium leading-6 text-foreground">
                Preço (R$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                step="0.01"
                min="0"
                placeholder="45.00"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              />
            </div>

            {/* Duração */}
            <div>
              <label htmlFor="duration_minutes" className="block text-sm font-medium leading-6 text-foreground">
                Duração (minutos)
              </label>
              <input
                type="number"
                id="duration_minutes"
                name="duration_minutes"
                min="1"
                placeholder="30"
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="submit"
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Criar Serviço
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Serviços */}
      <div className="overflow-hidden rounded-lg bg-card shadow">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-secondary">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Nome
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Preço
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Duração
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Agendamentos
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {(services || []).map((service) => {
              const pendingCount = appointmentCountByService.get(service.id) || 0
              const canDelete = pendingCount === 0

              return (
                <tr key={service.id} className="hover:bg-secondary transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    {service.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(service.price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {service.duration_minutes
                      ? `${service.duration_minutes} min`
                      : 'Não definida'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      pendingCount > 0
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {pendingCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {canDelete ? (
                      <DeleteServiceButton
                        serviceId={service.id}
                        serviceName={service.name}
                        onDelete={deleteService}
                      />
                    ) : (
                      <span className="text-muted-foreground cursor-not-allowed text-xs" title="Não pode deletar serviço com agendamentos pendentes">
                        Em uso
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {(!services || services.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhum serviço cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
