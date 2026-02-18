import Link from 'next/link'
import Calendar from '@/components/Calendar'

interface DashboardProps {
  searchParams?: Promise<{ month?: string; year?: string }>
}

export default async function Dashboard(props: DashboardProps) {
  const searchParams = await props.searchParams
  const month = searchParams?.month ? parseInt(searchParams.month) : undefined
  const year = searchParams?.year ? parseInt(searchParams.year) : undefined

  return (
    <div>
      {/* Título da Página */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Agenda
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie seus agendamentos e horários do mês
          </p>
        </div>
      </div>

      {/* Calendário */}
      <Calendar month={month} year={year} />
    </div>
  )
}