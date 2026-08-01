import dayjs from 'dayjs'

/**
 * Período de liquidación de comisiones: del 1 de un mes al 1 del mes siguiente.
 *
 * El día 1 es el de CIERRE, no el de apertura: mientras ese día no haya pasado,
 * el período sigue siendo el que se está cerrando. Recién el día 2 arranca el
 * período nuevo.
 *
 *   30/07  →  01/07 .. 01/08
 *   01/08  →  01/07 .. 01/08   (el 1 todavía no pasó)
 *   02/08  →  01/08 .. 01/09
 *
 * Vive acá y no dentro del store porque la campanita de notificaciones tiene que
 * mirar EXACTAMENTE el mismo período que la pantalla de comisiones. Si cada uno
 * calculara el suyo, terminarían mostrando números distintos.
 */
export function getPeriodoComisiones(): { desde: string; hasta: string } {
  const hoy = dayjs()
  const inicio = hoy.date() === 1
    ? hoy.subtract(1, 'month').startOf('month')
    : hoy.startOf('month')

  return {
    desde: inicio.format('YYYY-MM-DD'),
    hasta: inicio.add(1, 'month').format('YYYY-MM-DD'),
  }
}
