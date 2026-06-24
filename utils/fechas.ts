import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const TZ_PERU = 'America/Lima'

/**
 * Parsea una fecha que el backend de reportes emite ya formateada como
 * `DD/MM/YYYY` (p. ej. el endpoint /ganancias usa DATE_FORMAT). dayjs no
 * interpreta ese formato por defecto y devuelve "Invalid Date", por lo que
 * aquÃ­ se parsea explÃ­citamente. Si el string no cumple ese formato se
 * intenta el parseo por defecto (ISO).
 */
export function parseFechaDMY(fecha?: string | null): Dayjs | null {
  if (!fecha) return null
  const d = dayjs(fecha, 'DD/MM/YYYY', true)
  if (d.isValid()) return d
  const fallback = dayjs(fecha)
  return fallback.isValid() ? fallback : null
}

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
 * Formatea una fecha del backend a hora de Perú.
 * Usar en lugar de dayjs(fecha).format() para garantizar
 * que la hora mostrada siempre sea la de Perú, independientemente
 * de la zona horaria del navegador.
 *
 * El backend (Laravel) tiene timezone='America/Lima', así que los
 * strings sin marcador de TZ ya vienen en hora de Perú y NO deben
 * reinterpretarse como UTC. Solo strings con `Z` o offset explícito
 * son convertidos desde UTC.
 */
export function formatFechaPeru(
  fecha: string | Date | null | undefined,
  formato: string = 'DD/MM/YYYY hh:mm:ss A',
): string {
  if (!fecha) return ''
  // Date-only strings (YYYY-MM-DD) representan un día calendario, no un instante.
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return dayjs(fecha).format(formato)
  }
  // Si el string tiene marcador de timezone (Z, +HH:MM, -HH:MM al final),
  // viene como UTC/offset explícito → convertir a Perú.
  if (typeof fecha === 'string' && /(Z|[+-]\d{2}:?\d{2})$/.test(fecha)) {
    return dayjs.utc(fecha).tz(TZ_PERU).format(formato)
  }
  // Date objects o strings sin TZ: el backend ya los emite en hora de Perú.
  if (fecha instanceof Date) {
    return dayjs(fecha).tz(TZ_PERU).format(formato)
  }
  return dayjs.tz(fecha, TZ_PERU).format(formato)
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
