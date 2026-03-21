"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { CalendarDaysIcon, UsersIcon, ScissorsIcon, CreditCardIcon, CrownIcon, LogOutIcon } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"

const navItems = [
  { title: "Agenda", href: "/dashboard", icon: CalendarDaysIcon },
  { title: "Clientes", href: "/dashboard/customers", icon: UsersIcon },
  { title: "Mensalistas", href: "/dashboard/subscriptions", icon: CrownIcon },
  { title: "Serviços", href: "/dashboard/servicos", icon: ScissorsIcon },
  { title: "Planos", href: "/dashboard/settings/plans", icon: CreditCardIcon },
]

interface AppSidebarProps {
  userEmail?: string
  tenantName?: string
}

export function AppSidebar({ userEmail, tenantName = 'Minha Barbearia' }: AppSidebarProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ScissorsIcon className="text-primary h-6 w-6" />
          <span className="text-foreground text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            {tenantName}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.href} className="transition-all duration-200 hover:translate-x-1">
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {userEmail && (
          <p className="text-muted-foreground mb-2 truncate text-xs group-data-[collapsible=icon]:hidden">
            {userEmail}
          </p>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sair"
              onClick={handleSignOut}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOutIcon />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
