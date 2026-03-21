import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import Header from '@/components/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Busca o nome do tenant para mostrar na sidebar
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, tenants(name)')
    .eq('id', user.id)
    .single()

  const tenantName = (profile?.tenants as { name: string } | null)?.name || 'Minha Barbearia'

  return (
    <SidebarProvider>
      {/* Sidebar fixa na esquerda */}
      <AppSidebar userEmail={user.email} tenantName={tenantName} />

      <SidebarInset className="flex flex-col">
        {/* TopBar limpa: trigger + busca + perfil */}
        <Header user={user} />

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
