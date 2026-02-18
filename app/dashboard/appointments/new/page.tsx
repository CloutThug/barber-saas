import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Server Action para criar o agendamento
async function createAppointment(formData: FormData) {
  'use server'
  
  try {
    const supabase = await createClient()
    
    // Verifica usuário logado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/login')
    }

    // Busca o tenant_id do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      throw new Error(`Erro ao buscar perfil: ${profileError.message}`)
    }

    if (!profile?.tenant_id) {
      console.error('Tenant não encontrado para o usuário:', user.id)
      throw new Error('Tenant não encontrado')
    }

    console.log('Criando agendamento para tenant:', profile.tenant_id, 'usuário:', user.id)

    // Extrai os dados do formulário
    const customer_id = formData.get('customer_id') as string
    const service_id = formData.get('service_id') as string
    const scheduled_date = formData.get('scheduled_date') as string
    const scheduled_time = formData.get('scheduled_time') as string

    // Combina data e hora no formato ISO
    const scheduled_at = scheduled_date && scheduled_time 
      ? `${scheduled_date}T${scheduled_time}:00`
      : null

    // Valida os dados
    if (!customer_id || !service_id || !scheduled_at) {
      console.error('Dados incompletos:', { customer_id, service_id, scheduled_date, scheduled_time, scheduled_at })
      throw new Error('Todos os campos são obrigatórios')
    }

    console.log('Dados validados:', { customer_id, service_id, scheduled_at, tenant_id: profile.tenant_id })

    // Verifica se o cliente e serviço pertencem ao tenant
    const [customerCheck, serviceCheck] = await Promise.all([
      supabase
        .from('customers')
        .select('id, tenant_id')
        .eq('id', customer_id)
        .single(),
      supabase
        .from('services')
        .select('id, tenant_id')
        .eq('id', service_id)
        .single()
    ])

    if (customerCheck.error) {
      console.error('Cliente não encontrado:', { customer_id, error: customerCheck.error })
      throw new Error(`Cliente não encontrado: ${customerCheck.error.message}`)
    }

    if (serviceCheck.error) {
      console.error('Serviço não encontrado:', { service_id, error: serviceCheck.error })
      throw new Error(`Serviço não encontrado: ${serviceCheck.error.message}`)
    }

    if (customerCheck.data?.tenant_id !== profile.tenant_id) {
      console.error('Cliente não pertence ao tenant:', { customer_tenant: customerCheck.data?.tenant_id, user_tenant: profile.tenant_id })
      throw new Error('Cliente não pertence ao seu negócio')
    }

    if (serviceCheck.data?.tenant_id !== profile.tenant_id) {
      console.error('Serviço não pertence ao tenant:', { service_tenant: serviceCheck.data?.tenant_id, user_tenant: profile.tenant_id })
      throw new Error('Serviço não pertence ao seu negócio')
    }

    console.log('Cliente e serviço validados com sucesso')

    // Insere o agendamento
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        customer_id,
        service_id,
        scheduled_at,
        tenant_id: profile.tenant_id,
        status: 'scheduled',
      })
      .select()

    if (error) {
      console.error('Erro completo ao criar agendamento:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        fullError: JSON.stringify(error, null, 2)
      })
      throw new Error(`Erro ao criar agendamento: ${error.message}${error.details ? ` - ${error.details}` : ''}${error.hint ? ` (Dica: ${error.hint})` : ''}`)
    }

    console.log('Agendamento criado com sucesso:', data)

    // Revalida a página do dashboard e redireciona
    revalidatePath('/dashboard')
    redirect('/dashboard')
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error('[createAppointment] Erro capturado:', errorMessage)
    throw err
  }
}

interface NewAppointmentPageProps {
  searchParams?: Promise<{ date?: string; time?: string }>
}

export default async function NewAppointmentPage(props: NewAppointmentPageProps) {
  const searchParams = await props.searchParams
  const dateParam = searchParams?.date
  const timeParam = searchParams?.time

  const supabase = await createClient()

  // Verifica usuário logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Busca o tenant_id do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return <div>Erro: Tenant não encontrado</div>
  }

  const { data: tenantSettings, error: tenantSettingsError } = await supabase
    .from('tenants')
    .select('default_appointment_time')
    .eq('id', profile.tenant_id)
    .single()

  if (tenantSettingsError?.message) {
    console.warn(
      'Aviso ao buscar configuracoes do tenant:',
      tenantSettingsError.message
    )
  }

  // Busca clientes do tenant (RLS já filtra automaticamente)
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('id, name, phone')
    .order('name')

  // Busca serviços do tenant (RLS já filtra automaticamente)
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .order('name')

  if (customersError) {
    console.error('Erro ao buscar clientes:', customersError)
  }

  if (servicesError) {
    console.error('Erro ao buscar serviços:', servicesError)
  }

  // Gera a data e hora atual separadamente
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(11, 16)

  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  const timePattern = /^\d{2}:\d{2}$/
  
  const tenantDefaultTime = tenantSettings?.default_appointment_time
    ? tenantSettings.default_appointment_time.slice(0, 5)
    : '09:00'

  // Define valores padrão com base nos parâmetros da URL ou valores atuais
  const defaultDate = dateParam && datePattern.test(dateParam) ? dateParam : localDate
  const defaultTime = timeParam && timePattern.test(timeParam) ? timeParam : tenantDefaultTime

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Novo Agendamento
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          Preencha os dados para criar um novo agendamento
        </p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
        <form action={createAppointment} className="space-y-6">
          {/* Campo Cliente */}
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium leading-6 text-gray-900">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              id="customer_id"
              name="customer_id"
              required
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="">Selecione um cliente</option>
              {customers?.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                </option>
              ))}
            </select>
            {(!customers || customers.length === 0) && (
              <p className="mt-2 text-sm text-red-600">
                Nenhum cliente cadastrado. Cadastre clientes primeiro.
              </p>
            )}
          </div>

          {/* Campo Serviço */}
          <div>
            <label htmlFor="service_id" className="block text-sm font-medium leading-6 text-gray-900">
              Serviço <span className="text-red-500">*</span>
            </label>
            <select
              id="service_id"
              name="service_id"
              required
              className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="">Selecione um serviço</option>
              {services?.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - R$ {service.price}
                  {service.duration_minutes ? ` (${service.duration_minutes}min)` : ''}
                </option>
              ))}
            </select>
            {(!services || services.length === 0) && (
              <p className="mt-2 text-sm text-red-600">
                Nenhum serviço cadastrado. Cadastre serviços primeiro.
              </p>
            )}
          </div>

          {/* Campo Data e Hora */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Campo Data */}
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium leading-6 text-gray-900">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="scheduled_date"
                name="scheduled_date"
                required
                defaultValue={defaultDate}
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>

            {/* Campo Hora */}
            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium leading-6 text-gray-900">
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="scheduled_time"
                name="scheduled_time"
                required
                defaultValue={defaultTime}
                className="mt-2 block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-x-3 pt-4 border-t border-gray-200">
            <a
              href="/dashboard"
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={!customers || customers.length === 0 || !services || services.length === 0}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Criar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
