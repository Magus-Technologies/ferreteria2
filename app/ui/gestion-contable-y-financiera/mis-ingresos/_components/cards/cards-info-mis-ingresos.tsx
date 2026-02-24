'use client'

import { useMemo, useState } from 'react'
import { FaMoneyBillWave, FaCalendarDay, FaListAlt, FaChartLine, FaPrint, FaPlus } from 'react-icons/fa'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import { useGetResumenIngresos } from '../../_hooks/use-get-ingresos'
import ButtonBase from '~/components/buttons/button-base'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import ModalCrearIngresoExtra from '../others/modal-crear-ingreso-extra'

export default function CardsInfoMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)
  const [openCrear, setOpenCrear] = useState(false)

  // Convert store filters to API filters
  const apiFilters = useMemo(() => {
    if (!filtros) return null

    return {
      fechaDesde: filtros.fechaDesde,
      fechaHasta: filtros.fechaHasta,
      motivoIngreso: filtros.motivoIngreso,
      cajeroRegistra: filtros.cajeroRegistra,
      sucursal: filtros.sucursal,
      busqueda: filtros.busqueda,
    }
  }, [filtros])

  // Fetch resumen data
  const { data: resumenResponse, isLoading } = useGetResumenIngresos(
    apiFilters || {},
    !!apiFilters
  )

  const resumen = resumenResponse?.data

  // Default values while loading or no data
  const totalIngresos = resumen?.total_ingresos ?? 0
  const ingresosHoy = resumen?.ingresos_hoy ?? 0
  const totalTransacciones = resumen?.total_transacciones ?? 0
  const promedioIngreso = resumen?.promedio_ingreso ?? 0

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <div className='flex flex-col gap-3 h-full'>
      {/* Total Ingresos */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaMoneyBillWave className='text-rose-600' size={16} />
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



      {/* Botón Agregar */}
      <ConfigurableElement componentId='gestion-contable.mis-ingresos.boton-agregar' label='Botón Agregar'>
        <ButtonBase
          onClick={() => setOpenCrear(true)}
          className='bg-rose-600 hover:bg-rose-700 border-rose-600 hover:border-rose-700 text-white flex items-center justify-center gap-2 mt-2 w-full py-3 h-auto text-base'
        >
          <FaPlus />
          Agregar Ingreso Extra
        </ButtonBase>
      </ConfigurableElement>

      <ModalCrearIngresoExtra
        open={openCrear}
        onClose={() => setOpenCrear(false)}
      />
    </div>
  )
}
