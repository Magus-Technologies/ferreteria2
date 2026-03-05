'use client'

import { useQuery } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useMemo } from 'react'

const calcularTotalVenta = (venta: VentaCompleta) => {
  return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
    for (const u of item.unidades_derivadas ?? []) {
      const precio = Number(u.precio ?? 0)
      const cantidad = Number(u.cantidad ?? 0)
      const descuento = Number(u.descuento ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      acc += bonificacion ? 0 : (precio * cantidad) - descuento
    }
    return acc
  }, 0)
}

/**
 * Hook que retorna un Set con los IDs de clientes que tienen deudas pendientes.
 * Se usa para resaltar en rojo las filas de clientes deudores en la tabla de búsqueda.
 */
export function useClientesConDeuda() {
  const { data } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR, 'clientes-con-deuda'],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar({ per_page: -1 })
      if (result.error) throw new Error(result.error.message)
      return result.data!
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const clientesConDeuda = useMemo(() => {
    const ventas = data?.data ?? []
    const ids = new Set<number>()
    for (const v of ventas) {
      const total = calcularTotalVenta(v)
      const cobrado = Number(v.total_cobrado || 0)
      if (total - cobrado > 0.01 && v.cliente_id) {
        ids.add(v.cliente_id)
      }
    }
    return ids
  }, [data?.data])

  return clientesConDeuda
}
