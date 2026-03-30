import Calendar from '@/components/Calendar'

interface AgendaProps {
  searchParams?: Promise<{ month?: string; year?: string }>
}

export default async function Agenda(props: AgendaProps) {
  const searchParams = await props.searchParams
  const month = searchParams?.month ? parseInt(searchParams.month) : undefined
  const year = searchParams?.year ? parseInt(searchParams.year) : undefined

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Agenda
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie seus agendamentos e horários do mês
          </p>
        </div>
      </div>

      <Calendar month={month} year={year} />
    </div>
  )
}
