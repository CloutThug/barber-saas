"use client"

import { useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isBefore,
  startOfDay,
  format,
  addMonths,
  subMonths,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon, CalendarIcon } from "lucide-react"
import { toast } from "sonner"

interface Customer {
  id: string
  name: string
  phone: string | null
}

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number | null
}

interface Appointment {
  id: string
  scheduled_at: string
  status: string | null
  customers?: { name: string; phone: string | null }
  services?: { name: string; price: number }
}

interface PendingAppointment {
  customer_id: string
  service_id: string
  date: string
  time: string
  customerName: string
  serviceName: string
  servicePrice: number
}

interface AppointmentSchedulerProps {
  customers: Customer[]
  services: Service[]
  appointments: Appointment[]
  createAction: (formData: FormData) => Promise<void>
}

const HOURS_START = 7
const HOURS_END = 21

function getHoursForDay(date: Date): string[] {
  const now = new Date()
  const isCurrentDay = isToday(date)
  const currentHour = now.getHours()

  return Array.from({ length: HOURS_END - HOURS_START + 1 }, (_, i) => {
    const hour = HOURS_START + i
    return `${hour.toString().padStart(2, "0")}:00`
  }).filter((hour) => {
    if (!isCurrentDay) return true
    return parseInt(hour) >= currentHour
  })
}

export default function AppointmentScheduler({
  customers,
  services,
  appointments,
  createAction,
}: AppointmentSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(
    format(new Date(), "yyyy-MM-dd")
  )
  const [pendingList, setPendingList] = useState<PendingAppointment[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [selectedService, setSelectedService] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calendar calculations
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, apt) => {
    const d = apt.scheduled_at.slice(0, 10)
    if (!acc[d]) acc[d] = []
    acc[d].push(apt)
    return acc
  }, {} as Record<string, Appointment[]>)

  // Get existing + pending appointments for selected date
  const selectedDayAppointments = selectedDate ? appointmentsByDate[selectedDate] || [] : []
  const selectedDayPending = pendingList.filter((p) => p.date === selectedDate)

  // Occupied hours (existing + pending)
  const occupiedHours = new Set([
    ...selectedDayAppointments.map((a) => {
      const d = new Date(a.scheduled_at)
      return `${d.getUTCHours().toString().padStart(2, "0")}:00`
    }),
    ...selectedDayPending.map((p) => p.time),
  ])

  const availableHours = selectedDate
    ? getHoursForDay(new Date(selectedDate + "T12:00:00")).filter(
        (h) => !occupiedHours.has(h)
      )
    : []

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

  function handleAddToPending() {
    if (!selectedDate || !selectedCustomer || !selectedService || !selectedTime) {
      toast.error("Preencha todos os campos")
      return
    }

    const customer = customers.find((c) => c.id === selectedCustomer)
    const service = services.find((s) => s.id === selectedService)

    if (!customer || !service) return

    // Check duplicate
    const isDuplicate = pendingList.some(
      (p) => p.date === selectedDate && p.time === selectedTime
    )
    if (isDuplicate) {
      toast.error("Ja existe um agendamento nesse horario")
      return
    }

    setPendingList((prev) => [
      ...prev,
      {
        customer_id: selectedCustomer,
        service_id: selectedService,
        date: selectedDate,
        time: selectedTime,
        customerName: customer.name,
        serviceName: service.name,
        servicePrice: service.price,
      },
    ])

    // Reset time selection
    setSelectedTime("")
    toast.success(`${customer.name} adicionado as ${selectedTime}`)
  }

  function handleRemovePending(index: number) {
    setPendingList((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmitAll() {
    if (pendingList.length === 0) {
      toast.error("Adicione pelo menos um agendamento")
      return
    }

    setIsSubmitting(true)

    try {
      for (const item of pendingList) {
        const formData = new FormData()
        formData.set("customer_id", item.customer_id)
        formData.set("service_id", item.service_id)
        formData.set("scheduled_date", item.date)
        formData.set("scheduled_time", item.time)
        await createAction(formData)
      }
      toast.success(`${pendingList.length} agendamento(s) criado(s)!`)
      setPendingList([])
    } catch {
      toast.error("Erro ao criar agendamentos")
    } finally {
      setIsSubmitting(false)
    }
  }

  const today = startOfDay(new Date())

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Layout: Calendario + Painel lateral */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-4 md:p-6">
              {/* Header do calendario */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold capitalize text-foreground">
                  {format(currentDate, "MMMM yyyy", { locale: ptBR })}
                </h2>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeftIcon className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRightIcon className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-primary py-1"
                  >
                    {day.toUpperCase()}
                  </div>
                ))}
              </div>

              {/* Grid dos dias */}
              <div className="grid grid-cols-7 gap-1">
                {daysInCalendar.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const dayApts = appointmentsByDate[dateStr] || []
                  const dayPending = pendingList.filter((p) => p.date === dateStr)
                  const isSelected = selectedDate === dateStr
                  const isCurrentDay = isToday(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isPast = isBefore(day, today) && !isCurrentDay

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={isPast}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        relative min-h-20 md:min-h-24 rounded-lg border p-1.5 text-left transition-all duration-200
                        ${isPast ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/15"}
                        ${isSelected
                          ? "border-primary bg-primary/15 shadow-md shadow-primary/20 ring-1 ring-primary/50"
                          : isCurrentDay
                            ? "border-primary/50 bg-primary/10"
                            : isCurrentMonth
                              ? "bg-secondary/50 border-border hover:border-primary/30"
                              : "bg-muted/30 border-border/50 opacity-40"
                        }
                      `}
                    >
                      <div
                        className={`text-xs font-semibold mb-1 ${
                          isCurrentDay ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {format(day, "d")}
                      </div>

                      {/* Indicadores de agendamentos */}
                      {dayApts.length > 0 && (
                        <div className="flex flex-wrap gap-0.5">
                          {dayApts.slice(0, 3).map((apt) => (
                            <div
                              key={apt.id}
                              className="size-1.5 rounded-full bg-primary"
                              title={apt.customers?.name}
                            />
                          ))}
                          {dayApts.length > 3 && (
                            <span className="text-[9px] text-muted-foreground">
                              +{dayApts.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Indicadores de pendentes */}
                      {dayPending.length > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {dayPending.map((_, i) => (
                            <div
                              key={i}
                              className="size-1.5 rounded-full bg-amber-400 animate-pulse"
                            />
                          ))}
                        </div>
                      )}

                      {/* Contagem total no canto */}
                      {(dayApts.length > 0 || dayPending.length > 0) && (
                        <div className="absolute bottom-1 right-1.5 text-[9px] font-medium text-muted-foreground">
                          {dayApts.length + dayPending.length}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel lateral - detalhes do dia selecionado */}
        <div className="space-y-4">
          {selectedDate ? (
            <>
              {/* Info do dia */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="size-4 text-primary" />
                    <h3 className="font-bold text-foreground capitalize">
                      {format(new Date(selectedDate + "T12:00:00"), "EEEE, dd 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </h3>
                  </div>

                  {/* Agendamentos existentes */}
                  {selectedDayAppointments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Agendados
                      </p>
                      {selectedDayAppointments.map((apt) => {
                        const time = new Date(apt.scheduled_at)
                        return (
                          <div
                            key={apt.id}
                            className="flex items-center justify-between rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-sm"
                          >
                            <div>
                              <span className="font-semibold text-foreground">
                                {apt.customers?.name}
                              </span>
                              <span className="text-muted-foreground ml-2 text-xs">
                                {apt.services?.name}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {time.getUTCHours().toString().padStart(2, "0")}:
                              {time.getUTCMinutes().toString().padStart(2, "0")}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Horarios livres */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Horarios livres
                    </p>
                    {availableHours.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {availableHours.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => setSelectedTime(hour)}
                            className={`
                              rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150
                              ${selectedTime === hour
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary"
                              }
                            `}
                          >
                            {hour}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nenhum horario disponivel
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Formulario rapido */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h4 className="font-bold text-sm text-foreground">Adicionar agendamento</h4>

                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Selecione o cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full rounded-md border-0 py-1.5 px-3 bg-background text-foreground text-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Selecione o servico</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - R$ {s.price.toFixed(2)}
                      </option>
                    ))}
                  </select>

                  {selectedTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="size-3.5 text-primary" />
                      <span className="text-foreground font-medium">{selectedTime}</span>
                      <span className="text-muted-foreground">selecionado</span>
                    </div>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddToPending}
                    disabled={!selectedCustomer || !selectedService || !selectedTime}
                    className="w-full"
                  >
                    <PlusIcon className="size-4" />
                    Adicionar a fila
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <CalendarIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Selecione um dia no calendario
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Fila de agendamentos pendentes */}
      {pendingList.length > 0 && (
        <Card className="border-primary/30 animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-foreground">
                Fila de agendamentos ({pendingList.length})
              </h3>
              <Button
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="animate-pulse-gold"
              >
                {isSubmitting
                  ? "Salvando..."
                  : `Confirmar ${pendingList.length} agendamento(s)`}
              </Button>
            </div>

            <div className="space-y-2 stagger-list">
              {pendingList.map((item, index) => (
                <div
                  key={`${item.date}-${item.time}-${index}`}
                  className="flex items-center justify-between rounded-md bg-secondary/50 border border-border px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(item.date + "T12:00:00"), "dd/MM", { locale: ptBR })}
                      {" "}
                      {item.time}
                    </Badge>
                    <span className="font-semibold text-foreground">
                      {item.customerName}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {item.serviceName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary text-xs font-medium">
                      R$ {item.servicePrice.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePending(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <XIcon className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
