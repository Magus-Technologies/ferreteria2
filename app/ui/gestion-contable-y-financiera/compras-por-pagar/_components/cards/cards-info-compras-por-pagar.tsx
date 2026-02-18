'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { FaFileInvoiceDollar, FaClock, FaExclamationTriangle } from 'react-icons/fa'
import { FaCalendarXmark } from 'react-icons/fa6'
import { compraApi, type Compra } from '~/lib/api/compra'
import { useStoreFiltrosComprasPorPagar } from '../../_store/store-filtros-compras-por-pagar'
import { useMemo } from 'react'
import dayjs from 'dayjs'

export default function CardsInfoComprasPorPagar() {
  const filtros = useStoreFiltrosComprasPorPagar(state => state.filtros)

  // Convert Prisma filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return undefined

    const fechaFilter = filtros.fecha as any;
    const desde = fechaFilter?.gte ? new Date(fechaFilter.gte).toISOString().split('T')[0] : undefined;
    const hasta = fechaFilter?.lte ? new Date(fechaFilter.lte).toISOString().split('T')[0] : undefined;

    return {
      almacen_id: filtros.almacen_id as number | undefined,
      proveedor_id: filtros.proveedor_id as number | undefined,
      user_id: filtros.user_id as string | undefined,
      desde,
      hasta,
      per_page: 100, // Máximo permitido por el backend
      page: 1,
    }
  }, [filtros])

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.COMPRAS_POR_PAGAR_STATS, apiFilters],
    queryFn: async () => {
      const result = await compraApi.getComprasPorPagar(apiFilters)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data!
    },
    enabled: !!filtros,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Calcular estadísticas de las compras por pagar
  const estadisticas = useMemo(() => {
    const compras = data?.data ?? []
    
    // El backend ya filtra compras a crédito con saldo pendiente
    let totalSaldo = 0
    let comprasVencidas30Dias = 0
    let comprasVencidas60Dias = 0
    let comprasVencidas90Dias = 0

    compras.forEach(compra => {
      // Calcular saldo
      const total = (compra.productos_por_almacen || []).reduce((acc, item) => {
        const costo = Number(item.costo ?? 0)
        for (const u of item.unidades_derivadas ?? []) {
          const cantidad = Number(u.cantidad ?? 0)
          const factor = Number(u.factor ?? 0)
          const flete = Number(u.flete ?? 0)
          const bonificacion = Boolean(u.bonificacion)
          const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
          acc += montoLinea
        }
        return acc
      }, 0)

      const totalPagado = Number(compra.total_pagado || 0)
      const saldo = total - totalPagado
      totalSaldo += saldo

      // Calcular días vencidos
      if (compra.fecha) {
        const fechaCompra = dayjs(compra.fecha)
        const hoy = dayjs()
        const diasVencidos = hoy.diff(fechaCompra, 'days')

        if (diasVencidos > 90) {
          comprasVencidas90Dias++
        } else if (diasVencidos > 60) {
          comprasVencidas60Dias++
        } else if (diasVencidos > 30) {
          comprasVencidas30Dias++
        }
      }
    })

    return {
      totalCompras: compras.length,
      totalSaldo,
      comprasVencidas30Dias,
      comprasVencidas60Dias,
      comprasVencidas90Dias,
    }
  }, [data?.data])

  return (
    <div className='flex flex-col gap-3 h-full'>
      {/* Total Compras por Pagar */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaFileInvoiceDollar className='text-red-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Total Compras por Pagar</div>
        </div>
        <div className='text-2xl font-bold text-red-600 text-center'>
          {isLoading ? '...' : estadisticas.totalCompras}
        </div>
      </div>

      {/* Saldo Total Pendiente */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaFileInvoiceDollar className='text-red-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Saldo Total Pendiente</div>
        </div>
        <div className='text-2xl font-bold text-red-600 text-center'>
          {isLoading ? '...' : `S/. ${estadisticas.totalSaldo.toFixed(2)}`}
        </div>
      </div>

      {/* Vencidas +30 días */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaClock className='text-orange-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Vencidas +30 días</div>
        </div>
        <div className='text-2xl font-bold text-orange-600 text-center'>
          {isLoading ? '...' : estadisticas.comprasVencidas30Dias}
        </div>
      </div>

      {/* Vencidas +60 días */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCalendarXmark className='text-red-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Vencidas +60 días</div>
        </div>
        <div className='text-2xl font-bold text-red-600 text-center'>
          {isLoading ? '...' : estadisticas.comprasVencidas60Dias}
        </div>
      </div>

      {/* Vencidas +90 días */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaExclamationTriangle className='text-red-700' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Vencidas +90 días</div>
        </div>
        <div className='text-2xl font-bold text-red-700 text-center'>
          {isLoading ? '...' : estadisticas.comprasVencidas90Dias}
        </div>
      </div>
    </div>
  )
}