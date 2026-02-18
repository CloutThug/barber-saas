import { createClient } from '@/lib/supabase-server'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, format, addMonths, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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

  // Get current user and their tenant_id
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao verificar usuário</p>
      </div>
    )
  }

  // Get user's tenant_id from profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.tenant_id) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao buscar informações do usuário</p>
      </div>
    )
  }

  const tenantId = profile.tenant_id

  // Calculate the date range for the calendar view
  const currentDate = new Date(year || new Date().getFullYear(), month !== undefined ? month : new Date().getMonth(), 1)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // 0 = Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

  // Get all days to display
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Fetch appointments for the entire month
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
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">Erro ao buscar agendamentos</p>
      </div>
    )
  }

  const appointmentsByDate = appointments?.reduce((acc, apt) => {
    const date = format(new Date(apt.scheduled_at), 'yyyy-MM-dd')
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>) || {}

  // Navigation
  const prevMonth = subMonths(currentDate, 1)
  const nextMonth = addMonths(currentDate, 1)
  const prevMonthUrl = `/dashboard?month=${prevMonth.getMonth()}&year=${prevMonth.getFullYear()}`
  const nextMonthUrl = `/dashboard?month=${nextMonth.getMonth()}&year=${nextMonth.getFullYear()}`

  // Week day headers in Portuguese
  const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header with title and navigation */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Link
              href={prevMonthUrl}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              ← Anterior
            </Link>
            <Link
              href={nextMonthUrl}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
            >
              Próximo →
            </Link>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center font-semibold text-gray-700 text-sm py-2"
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
                  min-h-32 p-2 border rounded-lg transition-all hover:shadow-md
                  ${isCurrentDay
                    ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                    : isCurrentMonth
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-100'
                  }
                  ${!isCurrentMonth ? 'opacity-50' : ''}
                `}
              >
                <div>
                  <div
                    className={`text-sm font-semibold mb-1 ${
                      isCurrentDay ? 'text-indigo-600' : 'text-gray-900'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>

                  {/* Appointments display */}
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-indigo-100 border border-indigo-200 rounded px-1.5 py-0.5 text-xs text-indigo-800 truncate hover:bg-indigo-200 transition-colors"
                      >
                        <div className="font-semibold truncate">
                          {apt.customers?.name || 'Sem nome'}
                        </div>
                        <div className="text-indigo-700 text-xs">
                          {format(new Date(apt.scheduled_at), 'HH:mm')}
                        </div>
                      </div>
                    ))}
                    {dayAppointments.length > 2 && (
                      <div className="text-xs text-gray-600 pl-1.5 font-medium">
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
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <Link
          href="/dashboard/appointments/new"
          className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          + Novo Agendamento
        </Link>
      </div>
    </div>
  )
}
