'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { compraApi } from '~/lib/api/compra'
import { useStoreFiltrosComprasPorPagar } from '../../_store/store-filtros-compras-por-pagar'
import { useMemo } from 'react'
import { Spin } from 'antd'

export default function TotalComprasPorPagar() {
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
    queryKey: [QueryKeys.COMPRAS_POR_PAGAR_TOTAL, apiFilters],
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

  // Calcular el total de saldo pendiente
  const totalSaldo = useMemo(() => {
    const compras = data?.data ?? []
    
    // El backend ya filtra compras a crédito con saldo pendiente
    return compras.reduce((acc, compra) => {
      const total = (compra.productos_por_almacen || []).reduce((itemAcc, item) => {
        const costo = Number(item.costo ?? 0)
        for (const u of item.unidades_derivadas ?? []) {
          const cantidad = Number(u.cantidad ?? 0)
          const factor = Number(u.factor ?? 0)
          const flete = Number(u.flete ?? 0)
          const bonificacion = Boolean(u.bonificacion)
          const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
          itemAcc += montoLinea
        }
        return itemAcc
      }, 0)

      const totalPagado = Number(compra.total_pagado || 0)
      const saldo = total - totalPagado
      return acc + saldo
    }, 0)
  }, [data?.data])

  if (isLoading) {
    return (
      <div className='flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg'>
        <Spin size='small' />
        <span className='text-sm text-red-700'>Calculando...</span>
      </div>
    )
  }

  return (
    <div className='flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg'>
      <span className='text-sm font-medium text-red-700'>Total por Pagar:</span>
      <span className='text-lg font-bold text-red-800'>
        S/. {totalSaldo.toLocaleString('es-PE', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    </div>
  )
}