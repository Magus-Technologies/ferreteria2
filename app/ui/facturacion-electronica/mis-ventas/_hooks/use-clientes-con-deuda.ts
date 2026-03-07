'use client'

import { useQuery } from '@tanstack/react-query'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useMemo } from 'react'
import dayjs from 'dayjs'

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

export interface DeudaCliente {
  totalDeuda: number
  cantidadVentas: number
  diasMaxMora: number
}

/**
 * Hook que retorna un Map con los IDs de clientes que tienen deudas pendientes
 * y los detalles de su deuda (monto total, cantidad de ventas, dias max de mora).
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

  const clientesDeudaMap = useMemo(() => {
    const ventas = data?.data ?? []
    const map = new Map<number, DeudaCliente>()

    for (const v of ventas) {
      const total = calcularTotalVenta(v)
      const cobrado = Number(v.total_cobrado || 0)
      const resta = total - cobrado

      if (resta > 0.01 && v.cliente_id) {
        const dias = dayjs().diff(dayjs(v.fecha), 'days')
        const existing = map.get(v.cliente_id)

        if (existing) {
          existing.totalDeuda += resta
          existing.cantidadVentas += 1
          existing.diasMaxMora = Math.max(existing.diasMaxMora, dias)
        } else {
          map.set(v.cliente_id, {
            totalDeuda: resta,
            cantidadVentas: 1,
            diasMaxMora: dias,
          })
        }
      }
    }

    return map
  }, [data?.data])

  return clientesDeudaMap
}
