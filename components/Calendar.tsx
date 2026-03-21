import { createClient } from '@/lib/supabase-server'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatBR } from '@/lib/date'
import Link from 'next/link'

interface Appointment {
  id: string
  scheduled_at: string
  customers?: { name: string; phone: string | null }
  services?: { name: string; price: number }
  status: string | null
}

interface CalendarProps {
  year?: number
  month?: number
}

export default async function Calendar({ year, month }: CalendarProps) {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-destructive">Erro ao verificar usuário</p>
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
        <p className="text-destructive">Erro ao buscar informações do usuário</p>
      </div>
    )
  }

  const tenantId = profile.tenant_id

  const currentDate = new Date(year || new Date().getFullYear(), month !== undefined ? month : new Date().getMonth(), 1)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const { data: appointments, error: appointmentsError } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      status,
      customers ( name, phone ),
      services ( name, price )
    `)
    .eq('tenant_id', tenantId)
    .gte('scheduled_at', monthStart.toISOString())
    .lte('scheduled_at', monthEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  if (appointmentsError) {
    console.error('Erro ao buscar agendamentos:', appointmentsError)
    return (
      <div className="bg-card rounded-lg shadow p-6">
        <p className="text-destructive">Erro ao buscar agendamentos</p>
      </div>
    )
  }

  const appointmentsByDate = appointments?.reduce((acc, apt) => {
    const date = formatBR(apt.scheduled_at, 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>) || {}

  const prevMonth = subMonths(currentDate, 1)
  const nextMonth = addMonths(currentDate, 1)
  const prevMonthUrl = `/dashboard?month=${prevMonth.getMonth()}&year=${prevMonth.getFullYear()}`
  const nextMonthUrl = `/dashboard?month=${nextMonth.getMonth()}&year=${nextMonth.getFullYear()}`

  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border animate-fade-in">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-foreground text-2xl font-bold capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Link
              href={prevMonthUrl}
              className="bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors"
            >
              ← Anterior
            </Link>
            <Link
              href={nextMonthUrl}
              className="bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors"
            >
              Próximo →
            </Link>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-6">
        {/* Week day headers */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-primary py-2 text-center text-sm font-semibold"
            >
              {day.slice(0, 3).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {daysInCalendar.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayAppointments = appointmentsByDate[dateStr] || []
            const isCurrentDay = isToday(day)
            const isCurrentMonth = isSameMonth(day, currentDate)

            return (
              <Link
                key={dateStr}
                href={`/dashboard/day/${encodeURIComponent(dateStr)}`}
                className={`
                  min-h-32 rounded-lg border p-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/15
                  ${isCurrentDay
                    ? 'border-primary/50 bg-primary/10 shadow-sm'
                    : isCurrentMonth
                      ? 'bg-secondary/50 border-border hover:border-primary/30'
                      : 'bg-muted/30 border-border/50'
                  }
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                `}
              >
                <div>
                  <div
                    className={`mb-1 text-sm font-semibold ${
                      isCurrentDay ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-primary/15 border-primary/25 text-primary-foreground hover:bg-primary/25 truncate rounded border px-1.5 py-0.5 text-xs transition-colors"
                      >
                        <div className="text-foreground truncate font-semibold">
                          {apt.customers?.name || 'Sem nome'}
                        </div>
                        <div className="text-primary text-xs">
                          {formatBR(apt.scheduled_at, 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-muted-foreground pl-1.5 text-xs font-medium">
                        +{dayAppointments.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Quick add button */}
      <div className="bg-secondary/50 border-border rounded-b-lg border-t px-6 py-4">
        <Link
          href="/dashboard/appointments/new"
          className="bg-primary text-primary-foreground hover:bg-primary/80 inline-block rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-colors"
        >
          + Novo Agendamento
        </Link>
      </div>
    </div>
  )
}
