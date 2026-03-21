"use client"

import { Button } from "./ui/button"
import { SearchIcon } from "lucide-react"
import { searchInputRef } from "./search"
import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import type { User } from "@supabase/supabase-js"
import { SidebarTrigger } from "./ui/sidebar"
import { Separator } from "./ui/separator"

interface HeaderProps {
  user?: User | null
}

const Header = ({ user }: HeaderProps) => {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showSearch, setShowSearch] = React.useState(false)

  const handleSearchClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
      return
    }
    setShowSearch(true)
  }

  return (
    <header className="bg-card/80 border-border flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm animate-fade-in">
      {/* Trigger para abrir/fechar sidebar no mobile e desktop */}
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Busca */}
      <div className="relative flex flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-primary/10"
          onClick={handleSearchClick}
          aria-label="Pesquisar"
          type="button"
        >
          <SearchIcon className="h-4 w-4" />
        </Button>

        {showSearch && (
          <input
            type="text"
            className="border-input bg-background focus:ring-primary ml-2 rounded border px-3 py-1 text-sm transition-all duration-200 focus:ring-2 focus:outline-none"
            placeholder="Pesquisar..."
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
            onBlur={() => {
              if (!searchTerm) {
                setShowSearch(false)
                setSearchTerm("")
              }
            }}
          />
        )}
      </div>

      {/* Perfil do usuário */}
      {user && (
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm md:block">
            {user.user_metadata?.full_name ?? user.email}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              {(user.user_metadata?.full_name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </header>
  )
}

export default Header
