import { createClient } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = await createClient()

  // Busca os agendamentos com os relacionamentos (Cliente e Serviço)
  // O RLS garante que só venham os dados da sua barbearia
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      status,
      customers ( name, phone ),
      services ( name, price )
    `)
    .order('scheduled_at', { ascending: true })

  if (error) {
    console.error('Erro ao buscar agendamentos:', error)
  }

  return (
    <div>
      {/* Título da Página */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Agenda
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gerencie seus agendamentos e horários
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          + Novo Agendamento
        </Link>
      </div>

      {/* Card de Próximos Agendamentos */}
      <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
          <div className="border-b border-gray-200 pb-5 mb-5">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Próximos Agendamentos
            </h3>
          </div>

          {!appointments || appointments.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              Nenhum agendamento encontrado.
            </p>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Data/Hora</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cliente</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Serviço</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {appointments.map((apt: any) => (
                    <tr key={apt.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {new Date(apt.scheduled_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {apt.customers?.name || 'Sem nome'}
                        <div className="text-xs text-gray-400">{apt.customers?.phone}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {apt.services?.name} 
                        <span className="ml-2 text-green-600 font-bold">
                          R$ {apt.services?.price}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                          ${apt.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {apt.status === 'scheduled' ? 'Agendado' : apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

    </div>
  )
}