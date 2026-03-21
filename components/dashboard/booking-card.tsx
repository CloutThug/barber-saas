"use client"

import { isFuture } from "date-fns"
import { formatBR, toBrasilia } from "@/lib/date"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Tables } from "@/types/supabase"

interface BookingCardProps {
  appointment: Tables<"appointments">
  serviceName: string
  tenantName: string
  tenantImageUrl?: string
  isMensalista?: boolean
}

export function BookingCard({
  appointment,
  serviceName,
  tenantName,
  tenantImageUrl,
  isMensalista,
}: BookingCardProps) {
  const isConfirmed = isFuture(toBrasilia(appointment.scheduled_at))

  return (
    <Card className="animate-slide-up hover:bg-card/20 min-w-[90%] transition-all duration-200 hover:scale-[1.03] hover:cursor-pointer hover:shadow-lg hover:shadow-primary/20">
      <CardContent className="flex justify-between p-0">
        {/* ESQUERDA */}
        <div className="flex flex-col gap-2 py-5 pl-5">
          <Badge
            className="w-fit"
            variant={isConfirmed ? "default" : "secondary"}
          >
            {isConfirmed ? "Confirmado" : "Finalizado"}
          </Badge>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{serviceName}</h3>
            {isMensalista && (
              <Badge className="bg-primary text-primary-foreground text-[10px] py-0 px-1 animate-pulse-gold">
                MENSALISTA
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={tenantImageUrl} />
              <AvatarFallback>{tenantName.charAt(0)}</AvatarFallback>
            </Avatar>
            <p className="text-sm">{tenantName}</p>
          </div>
        </div>
        {/* DIREITA */}
        <div className="flex flex-col items-center justify-center border-l-2 border-solid px-5">
          <p className="text-sm capitalize">
            {formatBR(appointment.scheduled_at, "MMMM")}
          </p>
          <p className="text-2xl">
            {formatBR(appointment.scheduled_at, "dd")}
          </p>
          <p className="text-sm">
            {formatBR(appointment.scheduled_at, "HH:mm")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
