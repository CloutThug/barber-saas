import { toZonedTime, format as formatTz } from 'date-fns-tz'
import { ptBR } from 'date-fns/locale'

const TIMEZONE = 'America/Sao_Paulo'

/**
 * Converte um timestamp UTC do Supabase para o horário de Brasília
 * e formata com date-fns usando locale ptBR.
 */
export function formatBR(date: string | Date, formatStr: string): string {
  const zonedDate = toZonedTime(typeof date === 'string' ? new Date(date) : date, TIMEZONE)
  return formatTz(zonedDate, formatStr, { locale: ptBR, timeZone: TIMEZONE })
}

/**
 * Retorna um Date no timezone de Brasília para comparações.
 */
export function toBrasilia(date: string | Date): Date {
  return toZonedTime(typeof date === 'string' ? new Date(date) : date, TIMEZONE)
}
