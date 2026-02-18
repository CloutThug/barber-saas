import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Verifica usuario logado
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <button
            type="button"
            className="peer p-2 text-gray-600 hover:text-gray-900"
            aria-label="Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {/* Mobile sidebar - hidden by default, shown on button hover/focus */}
          <div className="hidden peer-focus:block hover:block absolute top-full left-0 right-0 bg-white shadow-lg border-t">
            <nav className="px-4 py-2 space-y-1">
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
              >
                📅 Agenda
              </Link>
              <Link
                href="/dashboard/customers"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                👥 Clientes
              </Link>
              <Link
                href="/dashboard/servicos"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                ✂️ Serviços
              </Link>
            </nav>
            <div className="border-t border-gray-200 px-4 py-3">
              <p className="text-sm text-gray-500 truncate mb-2">{user.email}</p>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-700 hover:bg-red-50"
                >
                  🚪 Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
          {/* Logo/Title */}
          <div className="flex h-16 shrink-0 items-center border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  <li>
                    <Link
                      href="/dashboard"
                      className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-900 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      <span className="text-xl">📅</span>
                      Agenda
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/customers"
                      className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      <span className="text-xl">👥</span>
                      Clientes
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard/servicos"
                      className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                    >
                      <span className="text-xl">✂️</span>
                      Serviços
                    </Link>
                  </li>
                </ul>
              </li>

              {/* User section at bottom */}
              <li className="mt-auto">
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Logado como:</p>
                  <p className="text-sm text-gray-900 truncate mb-3">{user.email}</p>
                  <form action="/auth/signout" method="post">
                    <button
                      type="submit"
                      className="w-full flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-red-700 hover:text-red-900 hover:bg-red-50"
                    >
                      <span className="text-xl">🚪</span>
                      Sair
                    </button>
                  </form>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:pl-64">
        <main className="py-10 lg:py-10 pt-20 lg:pt-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
