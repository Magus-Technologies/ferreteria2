'use client'

import { useMemo } from 'react'
import { FaMoneyBillWave, FaCalendarDay, FaListAlt, FaChartLine } from 'react-icons/fa'
import CardDashboard from '~/app/_components/cards/card-dashboard'
import { useStoreFiltrosMisGastos } from '../../_store/store-filtros-mis-gastos'
import { useGetResumenGastos } from '../../_hooks/use-get-gastos'
import dayjs from 'dayjs'

export default function CardsInfoMisGastos() {
  const filtros = useStoreFiltrosMisGastos(state => state.filtros)

  // Convert store filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return null
    
    return {
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      motivoGasto: filtros.motivoGasto,
      cajeroRegistra: filtros.cajeroRegistra,
      sucursal: filtros.sucursal,
      busqueda: filtros.busqueda,
    }
  }, [filtros])

  // Fetch resumen data
  const { data: resumenResponse, isLoading } = useGetResumenGastos(
    apiFilters || {},
    !!apiFilters
  )

  const resumen = resumenResponse?.data

  // Default values while loading or no data
  const {
    totalGastos = 0,
    gastosHoy = 0,
    totalTransacciones = 0,
    promedioGasto = 0
  } = resumen || {}

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <div className='flex flex-col gap-3 h-full'>
      {/* Total Gastos */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaMoneyBillWave className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Total Gastos</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {isLoading ? '...' : totalGastos.toFixed(2)}
        </div>
      </div>

      {/* Gastos de Hoy */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCalendarDay className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Gastos de Hoy</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {isLoading ? '...' : gastosHoy.toFixed(2)}
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

      {/* Promedio por Gasto */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaChartLine className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Promedio por Gasto</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {isLoading ? '...' : promedioGasto.toFixed(2)}
        </div>
      </div>
    </div>
  )
}