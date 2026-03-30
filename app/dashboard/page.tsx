import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { formatBR, toBrasilia } from '@/lib/date'
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, CalendarDays, Users, TrendingUp, Plus, UserPlus } from 'lucide-react'

interface Appointment {
  id: string
  scheduled_at: string
  customers?: { name: string; phone: string | null }
  services?: { name: string; price: number }
  status: string | null
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scheduled: { label: 'Agendado', variant: 'secondary' },
  done: { label: 'Concluído', variant: 'default' },
  canceled: { label: 'Cancelado', variant: 'destructive' },
}

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return (
      <div className="rounded-lg bg-card p-6 shadow">
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
      <div className="rounded-lg bg-card p-6 shadow">
        <p className="text-destructive">Erro ao buscar informações do usuário</p>
      </div>
    )
  }

  const tenantId = profile.tenant_id

  const now = toBrasilia(new Date())
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const thirtyDaysAgo = subDays(now, 30)

  const [todayResult, monthResult, customersResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, scheduled_at, status, customers(name, phone), services(name, price)')
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('appointments')
      .select('id, status, services(price)')
      .eq('tenant_id', tenantId)
      .gte('scheduled_at', monthStart.toISOString())
      .lte('scheduled_at', monthEnd.toISOString()),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo.toISOString()),
  ])

  const todayAppointments = (todayResult.data ?? []) as Appointment[]
  const todayCount = todayAppointments.length

  const estimatedRevenue = (monthResult.data ?? []).reduce((sum, apt: { services?: { price: number } | null }) => {
    return sum + ((apt.services as { price: number } | null)?.price ?? 0)
  }, 0)

  const formattedRevenue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(estimatedRevenue)

  const newCustomersCount = customersResult.count ?? 0

  const monthAppointments = monthResult.data ?? []
  const totalMonth = monthAppointments.length
  const doneCount = monthAppointments.filter((apt: { status?: string | null }) => apt.status === 'done').length
  const attendanceRate = totalMonth > 0 ? Math.round((doneCount / totalMonth) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Visão geral do seu negócio
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/appointments/new">
              <Plus className="size-4" />
              Novo Agendamento
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/customers/new">
              <UserPlus className="size-4" />
              Novo Cliente
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Estimado (Mês)
              </CardTitle>
              <DollarSign className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formattedRevenue}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Agendamentos Hoje
              </CardTitle>
              <CalendarDays className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Novos Clientes (Mês)
              </CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCustomersCount}</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Comparecimento
              </CardTitle>
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Agendamentos de Hoje</CardTitle>
          <CardDescription>
            {format(now, "EEEE, d 'de' MMMM", { locale: ptBR })} — {todayCount} agendamento{todayCount !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum agendamento para hoje.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Horário</th>
                    <th className="pb-3 font-medium text-muted-foreground">Cliente</th>
                    <th className="pb-3 font-medium text-muted-foreground">Serviço</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppointments.map((apt) => {
                    const status = STATUS_MAP[apt.status ?? '']
                    return (
                      <tr key={apt.id} className="border-b border-border last:border-0">
                        <td className="py-3 font-medium">{formatBR(apt.scheduled_at, 'HH:mm')}</td>
                        <td className="py-3">{apt.customers?.name ?? 'Sem nome'}</td>
                        <td className="py-3">{apt.services?.name ?? '-'}</td>
                        <td className="py-3">
                          <Badge variant={status?.variant ?? 'outline'}>
                            {status?.label ?? 'Sem status'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
