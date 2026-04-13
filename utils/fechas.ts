import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const TZ_PERU = 'America/Lima'

export function toLocalString({
  date,
  format = 'YYYY-MM-DD HH:mm:ss',
}: {
  date?: Dayjs
  format?: string
}) {
  return date?.format(format)
}

export function toUTCString({
  date,
  format = 'YYYY-MM-DD HH:mm:ss',
}: {
  date?: Dayjs
  format?: string
}) {
  return date?.utc().format(format)
}

export function toUTCBD({ date }: { date: Dayjs }) {
  return date.utc().toDate().toISOString()
}

/**
 * Formatea una fecha del backend (UTC/ISO) a hora de Perú.
 * Usar en lugar de dayjs(fecha).format() para garantizar
 * que la hora mostrada siempre sea la de Perú, independientemente
 * de la zona horaria del navegador.
 */
export function formatFechaPeru(
  fecha: string | Date | null | undefined,
  formato: string = 'DD/MM/YYYY HH:mm:ss',
): string {
  if (!fecha) return ''
  return dayjs.utc(fecha).tz(TZ_PERU).format(formato)
}
