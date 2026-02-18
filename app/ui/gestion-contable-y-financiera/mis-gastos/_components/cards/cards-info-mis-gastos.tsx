'use client'

import { useMemo } from 'react'
import { FaMoneyBillWave, FaCalendarDay, FaListAlt, FaChartLine } from 'react-icons/fa'
import CardDashboard from '~/app/_components/cards/card-dashboard'
import { useStoreFiltrosMisGastos } from '../../_store/store-filtros-mis-gastos'
import dayjs from 'dayjs'

// Mock interface for gastos
interface Gasto {
  id: string
  fecha: string
  monto: number
  destino: string
  motivo: string
  comprobante: string
  cajero: string
  autoriza: string
  anulado: boolean
}

export default function CardsInfoMisGastos() {
  const filtros = useStoreFiltrosMisGastos(state => state.filtros)

  // Mock data - replace with actual API call
  const mockData: Gasto[] = [
    {
      id: '1',
      fecha: '2024-02-17',
      monto: 250.00,
      destino: 'MI REDENTOR',
      motivo: 'Compra de materiales de oficina',
      comprobante: 'EFRAIN',
      cajero: 'Juan Pérez',
      autoriza: 'María García',
      anulado: false
    },
    {
      id: '2',
      fecha: '2024-02-17',
      monto: 180.50,
      destino: 'PROVEEDOR ABC',
      motivo: 'Gastos de transporte',
      comprobante: 'EFRAIN',
      cajero: 'Ana López',
      autoriza: 'Carlos Ruiz',
      anulado: false
    },
    {
      id: '3',
      fecha: '2024-02-16',
      monto: 420.00,
      destino: 'SERVICIOS GENERALES',
      motivo: 'Mantenimiento de equipos',
      comprobante: 'EFRAIN',
      cajero: 'Pedro Sánchez',
      autoriza: 'María García',
      anulado: true
    },
    {
      id: '4',
      fecha: '2024-02-15',
      monto: 150.00,
      destino: 'LIMPIEZA',
      motivo: 'Productos de limpieza',
      comprobante: 'EFRAIN',
      cajero: 'Luis Torres',
      autoriza: 'María García',
      anulado: false
    }
  ]

  const { totalGastos, gastosHoy, totalTransacciones, promedioGasto } = useMemo(() => {
    if (!filtros) {
      return {
        totalGastos: 0,
        gastosHoy: 0,
        totalTransacciones: 0,
        promedioGasto: 0
      }
    }

    let filteredData = mockData

    // Aplicar filtros
    if (filtros.fechaDesde) {
      filteredData = filteredData.filter(item => 
        dayjs(item.fecha).isAfter(dayjs(filtros.fechaDesde).subtract(1, 'day'))
      )
    }
    if (filtros.fechaHasta) {
      filteredData = filteredData.filter(item => 
        dayjs(item.fecha).isBefore(dayjs(filtros.fechaHasta).add(1, 'day'))
      )
    }

    // Solo gastos no anulados
    const gastosValidos = filteredData.filter(item => !item.anulado)
    
    // Gastos de hoy
    const hoy = dayjs().format('YYYY-MM-DD')
    const gastosDeHoy = gastosValidos.filter(item => 
      dayjs(item.fecha).format('YYYY-MM-DD') === hoy
    )

    const totalGastos = gastosValidos.reduce((sum, item) => sum + item.monto, 0)
    const gastosHoy = gastosDeHoy.reduce((sum, item) => sum + item.monto, 0)
    const totalTransacciones = gastosValidos.length
    const promedioGasto = totalTransacciones > 0 ? totalGastos / totalTransacciones : 0

    return {
      totalGastos,
      gastosHoy,
      totalTransacciones,
      promedioGasto
    }
  }, [filtros])

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
          {totalGastos.toFixed(2)}
        </div>
      </div>

      {/* Gastos de Hoy */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCalendarDay className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Gastos de Hoy</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {gastosHoy.toFixed(2)}
        </div>
      </div>

      {/* Total Transacciones */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaListAlt className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Total Transacciones</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {totalTransacciones}
        </div>
      </div>

      {/* Promedio por Gasto */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaChartLine className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Promedio por Gasto</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {promedioGasto.toFixed(2)}
        </div>
      </div>
    </div>
  )
}