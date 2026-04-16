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

export interface VentaDeuda {
  id: string
  serie: string
  numero: string | number
  fecha: string
  fecha_vencimiento: string | null
  total: number
  cobrado: number
  resta: number
  diasMora: number
  diasFaltantes: number | null
  vencida: boolean
}

export interface DeudaCliente {
  totalDeuda: number
  cantidadVentas: number
  diasMaxMora: number
  diasMinFaltantes: number | null
  tieneVencidas: boolean
  ventas: VentaDeuda[]
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
    const hoy = dayjs().startOf('day')

    for (const v of ventas) {
      const total = calcularTotalVenta(v)
      const cobrado = Number(v.total_cobrado || 0)
      const resta = total - cobrado

      if (resta > 0.01 && v.cliente_id) {
        const fechaVenc = v.fecha_vencimiento ? dayjs(v.fecha_vencimiento).startOf('day') : null
        const diffDias = fechaVenc ? fechaVenc.diff(hoy, 'days') : null
        const diasMora = diffDias !== null && diffDias < 0 ? Math.abs(diffDias) : 0
        const diasFaltantes = diffDias !== null && diffDias >= 0 ? diffDias : null
        const vencida = diffDias !== null && diffDias < 0

        const ventaDeuda: VentaDeuda = {
          id: String(v.id),
          serie: v.serie || '-',
          numero: v.numero ?? '-',
          fecha: v.fecha,
          fecha_vencimiento: v.fecha_vencimiento || null,
          total,
          cobrado,
          resta,
          diasMora,
          diasFaltantes,
          vencida,
        }

        const existing = map.get(v.cliente_id)
        if (existing) {
          existing.totalDeuda += resta
          existing.cantidadVentas += 1
          existing.diasMaxMora = Math.max(existing.diasMaxMora, diasMora)
          existing.tieneVencidas = existing.tieneVencidas || vencida
          if (diasFaltantes !== null) {
            existing.diasMinFaltantes = existing.diasMinFaltantes === null
              ? diasFaltantes
              : Math.min(existing.diasMinFaltantes, diasFaltantes)
          }
          existing.ventas.push(ventaDeuda)
        } else {
          map.set(v.cliente_id, {
            totalDeuda: resta,
            cantidadVentas: 1,
            diasMaxMora: diasMora,
            diasMinFaltantes: diasFaltantes,
            tieneVencidas: vencida,
            ventas: [ventaDeuda],
          })
        }
      }
    }

    return map
  }, [data?.data])

  return clientesDeudaMap
}
