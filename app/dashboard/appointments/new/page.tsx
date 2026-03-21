import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import AppointmentScheduler from '@/components/dashboard/appointment-scheduler'

// Server Action para criar um agendamento
async function createAppointment(formData: FormData) {
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
    throw new Error('Tenant nao encontrado')
  }

  const customer_id = formData.get('customer_id') as string
  const service_id = formData.get('service_id') as string
  const scheduled_date = formData.get('scheduled_date') as string
  const scheduled_time = formData.get('scheduled_time') as string

  const scheduled_at = scheduled_date && scheduled_time
    ? `${scheduled_date}T${scheduled_time}:00-03:00`
    : null

  if (!customer_id || !service_id || !scheduled_at) {
    throw new Error('Todos os campos sao obrigatorios')
  }

  const { error } = await supabase
    .from('appointments')
    .insert({
      customer_id,
      service_id,
      scheduled_at,
      tenant_id: profile.tenant_id,
      status: 'scheduled',
    })

  if (error) {
    throw new Error(`Erro ao criar agendamento: ${error.message}`)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/appointments/new')
}

export default async function NewAppointmentPage() {
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
    return <div className="p-5 text-destructive">Erro: Tenant nao encontrado</div>
  }

  // Busca clientes, servicos e agendamentos em paralelo
  const [customersRes, servicesRes, appointmentsRes] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, phone')
      .order('name'),
    supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .order('name'),
    supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        customers ( name, phone ),
        services ( name, price )
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('scheduled_at', { ascending: true }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Novo Agendamento
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione um dia no calendario, escolha o horario e adicione a fila
        </p>
      </div>

      <AppointmentScheduler
        customers={customersRes.data || []}
        services={servicesRes.data || []}
        appointments={appointmentsRes.data || []}
        createAction={createAppointment}
      />
    </div>
  )
}
