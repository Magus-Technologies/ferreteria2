import type { QueryClient } from '@tanstack/react-query'
import type { Producto, ProductoAlmacen } from '~/app/_types/producto'
import type { TransferenciaStock } from '~/lib/api/transferencia-stock'

/**
 * Parchea EN MEMORIA el cache de ['productos-listado-completo'] con el stock
 * nuevo que devuelve una transferencia (crear/editar), para que el grid de Mi
 * Almacén refleje el cambio AL INSTANTE, sin esperar el refetch del listado
 * completo (~12MB / ~1.3s en backend).
 *
 * Reconciliación: el refetch de fondo (websocket / invalidación al remmontar)
 * corrige cualquier caso borde (p. ej. un producto recién creado en el almacén
 * destino que aún no estaba en el listado cacheado).
 */
export function patchStockListadoCompleto(
  queryClient: QueryClient,
  transferencia: TransferenciaStock | undefined,
): void {
  if (!transferencia?.productos?.length) return

  // producto_almacen.id -> stock_fraccion nuevo (origen y destino).
  const stockPorProductoAlmacenId = new Map<number, number>()
  for (const p of transferencia.productos) {
    stockPorProductoAlmacenId.set(p.producto_almacen_origen_id, Number(p.stock_nuevo_origen))
    stockPorProductoAlmacenId.set(p.producto_almacen_destino_id, Number(p.stock_nuevo_destino))
  }

  // setQueriesData (no setQueryData) para alcanzar todas las variantes por almacén:
  // queryKey real = ['productos-listado-completo', almacenId].
  queryClient.setQueriesData<Producto[]>(
    { queryKey: ['productos-listado-completo'] },
    (old) => {
      if (!old) return old
      let algunCambio = false
      const next = old.map((prod) => {
        let filaCambia = false
        const almacenes = prod.producto_en_almacenes.map((pa: ProductoAlmacen) => {
          const nuevoStock = stockPorProductoAlmacenId.get(pa.id)
          if (nuevoStock === undefined || Number(pa.stock_fraccion) === nuevoStock) return pa
          filaCambia = true
          return { ...pa, stock_fraccion: nuevoStock }
        })
        if (!filaCambia) return prod
        algunCambio = true
        return { ...prod, producto_en_almacenes: almacenes }
      })
      return algunCambio ? next : old
    },
  )
}
