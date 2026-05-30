import type { QueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'

/**
 * Invalida las queries afectadas cuando una entrega cambia de estado
 * (confirmar, marcar en camino, aceptar, anular, actualizar/restante).
 *
 * Una entrega no solo vive en mis-entregas: al entregar/anular cambia la
 * cobertura de la venta (cantidad_pendiente → columna "Entrega" en
 * mis-ventas). Como [VENTAS] tiene staleTime de 5 min, sin invalidarla la
 * columna de mis-ventas se queda vieja ("Pendiente") hasta que el staleTime
 * expira. Por eso este helper invalida AMBOS módulos en un solo lugar.
 */
export function invalidarEntregaYVenta(qc: QueryClient): void {
  qc.invalidateQueries({ queryKey: [QueryKeys.ENTREGAS_PRODUCTOS] })
  qc.invalidateQueries({ queryKey: [QueryKeys.VENTAS] })
  qc.invalidateQueries({ queryKey: [QueryKeys.VENTA_HISTORIAL] })
  qc.invalidateQueries({ queryKey: [QueryKeys.VENTAS_HISTORIAL_GENERAL] })
}
