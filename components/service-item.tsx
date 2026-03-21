"use client"

import Image from "next/image"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet"
import { Calendar } from "./ui/calendar"
import { ptBR } from "date-fns/locale"
import { useEffect, useMemo, useState } from "react"
import { format, isPast, isToday, set } from "date-fns"
import { createClient } from "@/lib/supabase-browser"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Separator } from "./ui/separator"
import type { Tables } from "@/types/supabase"

interface ServiceItemProps {
  service: Tables<"services">
  tenantName: string
}

const TIME_LIST = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]

interface GetTimeListProps {
  bookings: Tables<"appointments">[]
  selectedDay: Date
}

const getTimeList = ({ bookings, selectedDay }: GetTimeListProps) => {
  return TIME_LIST.filter((time) => {
    const hour = Number(time.split(":")[0])
    const minutes = Number(time.split(":")[1])

    const timeIsOnThePast = isPast(set(new Date(), { hours: hour, minutes }))
    if (timeIsOnThePast && isToday(selectedDay)) {
      return false
    }

    const hasBookingOnCurrentTime = bookings.some((booking) => {
      const bookingDate = new Date(booking.scheduled_at)
      return (
        bookingDate.getHours() === hour &&
        bookingDate.getMinutes() === minutes
      )
    })
    if (hasBookingOnCurrentTime) {
      return false
    }
    return true
  })
}

const ServiceItem = ({ service, tenantName }: ServiceItemProps) => {
  const router = useRouter()
  const supabase = createClient()
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  )
  const [dayBookings, setDayBookings] = useState<Tables<"appointments">[]>([])
  const [bookingSheetIsOpen, setBookingSheetIsOpen] = useState(false)

  useEffect(() => {
    const fetchBookings = async () => {
      if (!selectedDay) return
      const startOfDay = new Date(selectedDay)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDay)
      endOfDay.setHours(23, 59, 59, 999)

      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("service_id", service.id)
        .gte("scheduled_at", startOfDay.toISOString())
        .lte("scheduled_at", endOfDay.toISOString())

      setDayBookings(data ?? [])
    }
    fetchBookings()
  }, [selectedDay, service.id, supabase])

  const selectedDate = useMemo(() => {
    if (!selectedDay || !selectedTime) return
    return set(selectedDay, {
      hours: Number(selectedTime?.split(":")[0]),
      minutes: Number(selectedTime?.split(":")[1]),
    })
  }, [selectedDay, selectedTime])

  const handleBookingClick = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      return setBookingSheetIsOpen(true)
    }
    router.push("/login")
  }

  const handleBookingSheetOpenChange = () => {
    setSelectedDay(undefined)
    setSelectedTime(undefined)
    setDayBookings([])
    setBookingSheetIsOpen(false)
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDay(date)
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
  }

  const handleCreateBooking = async () => {
    try {
      if (!selectedDate) return
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("appointments").insert({
        customer_id: user.id,
        service_id: service.id,
        tenant_id: service.tenant_id,
        scheduled_at: selectedDate.toISOString(),
        status: "scheduled",
      })

      if (error) throw error

      handleBookingSheetOpenChange()
      toast.success("Reserva criada com sucesso!", {
        action: {
          label: "Ver agendamentos",
          onClick: () => router.push("/dashboard"),
        },
      })
    } catch (error) {
      console.error(error)
      toast.error("Erro ao criar reserva!")
    }
  }

  const timeList = useMemo(() => {
    if (!selectedDay) return []
    return getTimeList({
      bookings: dayBookings,
      selectedDay,
    })
  }, [dayBookings, selectedDay])

  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        {/* IMAGE */}
        <div className="relative max-h-[110px] min-h-[110px] max-w-[110px] min-w-[110px]">
          <Image
            alt={service.name || "Serviço"}
            src="/service-placeholder.png"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="rounded-lg object-cover"
          />
        </div>
        {/* DIREITA */}
        <div className="flex flex-1 flex-col space-y-2">
          <h3 className="text-sm font-semibold">{service.name}</h3>
          <p className="text-sm text-muted-foreground">
            {service.duration_minutes
              ? `${service.duration_minutes} min`
              : "Sem duração definida"}
          </p>
          {/* PREÇO E BOTÃO */}
          <div className="flex items-center justify-between">
            <p className="text-primary text-sm font-bold">
              {Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(service.price)}
            </p>
            <div className="flex-1" />
            <Sheet
              open={bookingSheetIsOpen}
              onOpenChange={(open: boolean) => {
                if (!open) handleBookingSheetOpenChange()
              }}
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBookingClick}
                className="ml-auto px-4 py-2 text-xs sm:text-sm md:text-base lg:px-6 lg:py-3"
              >
                Reservar
              </Button>

              <SheetContent className="px-0" aria-describedby={undefined}>
                <SheetHeader className="flex items-center">
                  <SheetTitle className="flex items-center">
                    Fazer Reserva
                  </SheetTitle>
                </SheetHeader>

                <div className="border-b border-solid px-5 py-5">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={selectedDay}
                    onSelect={handleDateSelect}
                    disabled={(date: Date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    className="w-full"
                  />
                </div>

                {selectedDay && (
                  <div className="flex gap-3 overflow-x-auto border-b border-solid p-5 [&::-webkit-scrollbar]:hidden">
                    {timeList.length > 0 ? (
                      timeList.map((time) => (
                        <Button
                          key={time}
                          variant={
                            selectedTime === time ? "default" : "outline"
                          }
                          className="rounded-full"
                          onClick={() => handleTimeSelect(time)}
                        >
                          {time}
                        </Button>
                      ))
                    ) : (
                      <p className="text-xs">
                        Não há horários disponíveis para este dia.
                      </p>
                    )}
                  </div>
                )}

                {selectedDate && (
                  <div className="p-5">
                    <Card>
                      <CardContent className="space-y-3 p-3">
                        <div className="flex items-center justify-between">
                          <h2 className="font-bold">{service.name}</h2>
                          <p className="text-primary text-sm font-bold">
                            {Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(service.price)}
                          </p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-muted-foreground">Data</p>
                          <p className="capitalize">
                            {format(selectedDate, "dd 'de' MMMM", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-muted-foreground">Horário</p>
                          <p>{format(selectedDate, "HH:mm")}</p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-muted-foreground">Barbearia</p>
                          <p>{tenantName}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <SheetFooter className="mt-5 px-5">
                  <Button
                    onClick={handleCreateBooking}
                    disabled={!selectedDay || !selectedTime}
                  >
                    Confirmar
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ServiceItem
