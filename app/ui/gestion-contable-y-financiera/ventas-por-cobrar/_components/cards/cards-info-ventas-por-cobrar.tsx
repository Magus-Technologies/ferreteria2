'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { ventaApi, type VentaCompleta } from '~/lib/api/venta'
import { useStoreFiltrosVentasPorCobrar } from '../../_store/store-filtros-ventas-por-cobrar'
import { useMemo } from 'react'
import dayjs from 'dayjs'

export default function CardsInfoVentasPorCobrar() {
  const filtros = useStoreFiltrosVentasPorCobrar(state => state.filtros)

  // Convert Prisma filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined

    const fechaFilter = filtros.fecha as any;
    const desde = fechaFilter?.gte ? new Date(fechaFilter.gte).toISOString().split('T')[0] : undefined;
    const hasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toISOString().split('T')[0] : undefined;

    return {
      almacen_id: filtros.almacen_id as number | undefined,
      cliente_id: filtros.cliente_id as number | undefined,
      user_id: filtros.user_id as string | undefined,
      desde,
      hasta,
      per_page: -1, // Obtener todas para calcular estadísticas
    }
  }, [filtros])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.VENTAS_POR_COBRAR_STATS, apiFilters],
    queryFn: async () => {
      const result = await ventaApi.getVentasPorCobrar(apiFilters)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!
    },
    enabled: !!filtros,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Función para calcular el total de una venta
  const calcularTotalVenta = (venta: VentaCompleta) => {
    return (venta.productos_por_almacen || []).reduce((acc, item: any) => {
      const precioUnitario = Number(item.precio_unitario ?? 0)
      for (const u of item.unidades_derivadas ?? []) {
        const cantidad = Number(u.cantidad ?? 0)
        const factor = Number(u.factor ?? 0)
        const descuento = Number(u.descuento ?? 0)
        const bonificacion = Boolean(u.bonificacion)
        const montoLinea = bonificacion ? 0 : (precioUnitario * cantidad * factor) - descuento
        acc += montoLinea
      }
      return acc
    }, 0)
  }

  // Calcular estadísticas de las ventas por cobrar
  const estadisticas = useMemo(() => {
    const ventas = data?.data ?? []
    
    let totalSaldo = 0
    let saldoVencido30 = 0
    let saldoVencido60 = 0
    let saldoVencido90 = 0

    ventas.forEach(venta => {
      // Calcular saldo
      const total = calcularTotalVenta(venta)
      const totalPagado = Number(venta.total_pagado || 0)
      const saldo = total - totalPagado
      totalSaldo += saldo

      // Calcular días vencidos y acumular saldo por categoría
      if (venta.fecha) {
        const fechaVenta = dayjs(venta.fecha)
        const hoy = dayjs()
        const diasVencidos = hoy.diff(fechaVenta, 'days')

        if (diasVencidos > 90) {
          saldoVencido90 += saldo
        } else if (diasVencidos > 60) {
          saldoVencido60 += saldo
        } else if (diasVencidos > 30) {
          saldoVencido30 += saldo
        }
      }
    })

    return {
      totalVentas: ventas.length,
      totalSaldo,
      saldoVencido30,
      saldoVencido60,
      saldoVencido90,
    }
  }, [data?.data])

  if (isLoading) {
    return (
      <div className='flex flex-col gap-3 h-full'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='bg-white border border-slate-200 rounded-lg p-5 animate-pulse'>
            <div className='h-4 bg-slate-200 rounded w-3/4 mx-auto mb-3'></div>
            <div className='h-8 bg-slate-200 rounded w-1/2 mx-auto'></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-3 h-full'>
      {/* Total Saldo Pendiente */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-red-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Saldo Total Pendiente
        </h3>
        <p className='text-xl font-bold text-nowrap text-red-600'>
          S/.{' '}
          {estadisticas.totalSaldo.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Vencidas +30 días */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-orange-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Vencidas +30 días
        </h3>
        <p className='text-xl font-bold text-nowrap text-orange-600'>
          S/.{' '}
          {estadisticas.saldoVencido30.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Vencidas +60 días */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-red-200 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Vencidas +60 días
        </h3>
        <p className='text-xl font-bold text-nowrap text-red-600'>
          S/.{' '}
          {estadisticas.saldoVencido60.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>

      {/* Vencidas +90 días */}
      <div className='flex flex-col items-center justify-center px-4 py-5 border border-red-300 rounded-lg shadow-md w-full bg-white'>
        <h3 className='text-sm font-medium text-center text-slate-600 mb-2'>
          Vencidas +90 días
        </h3>
        <p className='text-xl font-bold text-nowrap text-red-700'>
          S/.{' '}
          {estadisticas.saldoVencido90.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
    </div>
  )
}
