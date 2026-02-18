'use client'

import { useMemo } from 'react'
import { FaDollarSign, FaCalendarDay, FaListAlt, FaChartLine } from 'react-icons/fa'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import { useGetResumenIngresos } from '../../_hooks/use-get-ingresos'
import dayjs from 'dayjs'

export default function CardsInfoMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)

  // Convert store filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return null
    
    return {
      desde: filtros.desde,
      hasta: filtros.hasta,
      user_id: filtros.user_id,
      concepto: filtros.concepto,
      search: filtros.search,
    }
  }, [filtros])

  // Fetch resumen data
  const { data: resumenResponse, isLoading } = useGetResumenIngresos(
    apiFilters || {},
    !!apiFilters
  )

  const resumen = resumenResponse?.data

  // Default values while loading or no data
  const {
    total_ingresos: totalIngresos = 0,
    ingresos_hoy: ingresosHoy = 0,
    total_transacciones: totalTransacciones = 0,
    promedio_ingreso: promedioIngreso = 0
  } = resumen || {}

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <div className='flex flex-col gap-3 h-full'>
      {/* Total Ingresos */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaDollarSign className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Total Ingresos</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {isLoading ? '...' : totalIngresos.toFixed(2)}
        </div>
      </div>

      {/* Ingresos de Hoy */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCalendarDay className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Ingresos de Hoy</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {isLoading ? '...' : ingresosHoy.toFixed(2)}
        </div>
      </div>

      {/* Total Transacciones */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaListAlt className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Total Transacciones</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {isLoading ? '...' : totalTransacciones}
        </div>
      </div>

      {/* Promedio por Ingreso */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaChartLine className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Promedio por Ingreso</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {isLoading ? '...' : promedioIngreso.toFixed(2)}
        </div>
      </div>
    </div>
  )
}