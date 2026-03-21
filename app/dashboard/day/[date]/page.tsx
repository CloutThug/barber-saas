import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'
import { addHours, format, isToday, isValid, parseISO, startOfDay } from 'date-fns'
import { formatBR, toBrasilia } from '@/lib/date'

interface Appointment {
  id: string
  scheduled_at: string
  customers?: { name: string; phone: string | null }
  services?: { name: string; price: number }
  status: string | null
}

const STATUS_BADGES: Record<
  string,
  { label: string; className: string }
> = {
  scheduled: {
    label: 'Agendado',
    className: 'bg-primary/20 text-primary ring-primary/30',
  },
  canceled: {
    label: 'Cancelado',
    className: 'bg-destructive/20 text-destructive ring-destructive/30',
  },
  done: {
    label: 'Concluído',
    className: 'bg-primary/20 text-primary ring-primary/30',
  },
  default: {
    label: 'Sem status',
    className: 'bg-muted text-muted-foreground ring-border',
  },
}

interface DayPageProps {
  params: Promise<{ date: string }>
}

export default async function DayPage(props: DayPageProps) {
  const { date } = await props.params
  const parsedDate = parseISO(date)

  if (!isValid(parsedDate)) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-red-600">Data inválida.</p>
      </div>
    )
  }

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
  const dayStart = startOfDay(parsedDate)
  const dayEnd = addHours(dayStart, 24)

  const { data: appointments } = await supabase
    .from('appointments')
    .select(
      `
      id,
      scheduled_at,
      status,
      customers ( name, phone ),
      services ( name, price )
    `
    )
    .eq('tenant_id', tenantId)
    .gte('scheduled_at', dayStart.toISOString())
    .lt('scheduled_at', dayEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  const appointmentsByHour = (appointments || []).reduce((acc, apt) => {
    const hour = formatBR(apt.scheduled_at, 'HH:00')
    if (!acc[hour]) {
      acc[hour] = []
    }
    acc[hour].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>)

  const hoursStart = 7
  const hoursEnd = 21
  const now = toBrasilia(new Date())
  const currentHour = now.getHours()
  const isTodayView = isToday(parsedDate)

  const hours = Array.from({ length: hoursEnd - hoursStart + 1 }, (_, index) => {
    const hour = hoursStart + index
    return `${hour.toString().padStart(2, '0')}:00`
  }).filter((hour) => {
    // Se for hoje, só mostra horários a partir da hora atual
    if (!isTodayView) return true
    const hourNum = parseInt(hour)
    return hourNum >= currentHour
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Agenda do dia
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {format(parsedDate, 'dd/MM/yyyy')}
          </p>
        </div>
        <Link
          href={`/dashboard/appointments/new?date=${date}`}
          className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          + Novo Agendamento
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow animate-fade-in">
        <div className="divide-y divide-border stagger-list">
          {hours.map((hour) => {
            const slotAppointments = appointmentsByHour[hour] || []
            const addLink = `/dashboard/appointments/new?date=${encodeURIComponent(
              date
            )}&time=${encodeURIComponent(hour)}`

            return (
              <div key={hour} className="px-6 py-4">
                <div className="flex items-start justify-between gap-6">
                  <div className="w-24 text-sm font-semibold text-muted-foreground">
                    {hour}
                  </div>
                  <div className="flex-1">
                    {slotAppointments.length === 0 ? (
                      <Link
                        href={addLink}
                        className="inline-flex items-center justify-center rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        +
                      </Link>
                    ) : (
                      <div className="space-y-2">
                        {slotAppointments.map((apt) => {
                          const statusKey = (apt.status || '').toLowerCase()
                          const badge = STATUS_BADGES[statusKey] || STATUS_BADGES.default

                          return (
                            <div
                              key={apt.id}
                              className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm"
                            >
                              <div className="font-semibold text-foreground">
                                {apt.customers?.name || 'Sem nome'}
                              </div>
                              <div className="text-muted-foreground">
                                {apt.services?.name || 'Serviço'}
                              </div>
                              <span
                                className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <div className="w-24 text-right text-xs text-muted-foreground">
                    {slotAppointments.length > 0
                      ? `${slotAppointments.length} agendamento(s)`
                      : 'Livre'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
