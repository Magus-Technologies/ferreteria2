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
  formato: string = 'DD/MM/YYYY hh:mm:ss A',
): string {
  if (!fecha) return ''
  // Date-only strings (YYYY-MM-DD) representan un día calendario, no un instante.
  // Formatearlos sin convertir TZ evita que UTC midnight se desplace a Lima -5h.
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return dayjs(fecha).format(formato)
  }
  return dayjs.utc(fecha).tz(TZ_PERU).format(formato)
}

/**
 * Combina el día elegido por el usuario con la hora/minuto/segundo
 * del momento actual (submit). Resuelve el bug de que la hora
 * guardada era la de apertura del formulario, no la de finalización.
 */
export function fechaSubmit(fechaElegida: Dayjs): string {
  const ahora = dayjs()
  return fechaElegida
    .hour(ahora.hour())
    .minute(ahora.minute())
    .second(ahora.second())
    .format('YYYY-MM-DD HH:mm:ss')
}
