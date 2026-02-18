'use client'

import { useMemo } from 'react'
import { FaDollarSign, FaCalendarDay, FaListAlt, FaChartLine } from 'react-icons/fa'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import dayjs from 'dayjs'

// Mock interface for ingresos
interface Ingreso {
  id: string
  fecha: string
  monto: number
  concepto: string
  comentario: string
  cajero: string
  autoriza: string
  anulado: boolean
}

export default function CardsInfoMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)

  // Mock data - replace with actual API call
  const mockData: Ingreso[] = [
    {
      id: '1',
      fecha: '2024-02-17',
      monto: 1500.00,
      concepto: 'Venta de productos',
      comentario: 'Venta al contado - Cliente frecuente',
      cajero: 'Juan Pérez',
      autoriza: 'María García',
      anulado: false
    },
    {
      id: '2',
      fecha: '2024-02-17',
      monto: 850.50,
      concepto: 'Cobro de servicios',
      comentario: 'Servicio de instalación',
      cajero: 'Ana López',
      autoriza: 'Carlos Ruiz',
      anulado: false
    },
    {
      id: '3',
      fecha: '2024-02-16',
      monto: 2200.00,
      concepto: 'Venta mayorista',
      comentario: 'Venta a empresa constructora',
      cajero: 'Pedro Sánchez',
      autoriza: 'María García',
      anulado: true
    },
    {
      id: '4',
      fecha: '2024-02-15',
      monto: 650.00,
      concepto: 'Cobro de deuda',
      comentario: 'Pago de factura pendiente',
      cajero: 'Luis Torres',
      autoriza: 'María García',
      anulado: false
    }
  ]

  const { totalIngresos, ingresosHoy, totalTransacciones, promedioIngreso } = useMemo(() => {
    if (!filtros) {
      return {
        totalIngresos: 0,
        ingresosHoy: 0,
        totalTransacciones: 0,
        promedioIngreso: 0
      }
    }

    let filteredData = mockData

    // Aplicar filtros
    if (filtros.fecha?.gte) {
      filteredData = filteredData.filter(item => 
        dayjs(item.fecha).isAfter(dayjs(filtros.fecha?.gte).subtract(1, 'day'))
      )
    }
    if (filtros.fecha?.lte) {
      filteredData = filteredData.filter(item => 
        dayjs(item.fecha).isBefore(dayjs(filtros.fecha?.lte).add(1, 'day'))
      )
    }

    // Solo ingresos no anulados
    const ingresosValidos = filteredData.filter(item => !item.anulado)
    
    // Ingresos de hoy
    const hoy = dayjs().format('YYYY-MM-DD')
    const ingresosDeHoy = ingresosValidos.filter(item => 
      dayjs(item.fecha).format('YYYY-MM-DD') === hoy
    )

    const totalIngresos = ingresosValidos.reduce((sum, item) => sum + item.monto, 0)
    const ingresosHoy = ingresosDeHoy.reduce((sum, item) => sum + item.monto, 0)
    const totalTransacciones = ingresosValidos.length
    const promedioIngreso = totalTransacciones > 0 ? totalIngresos / totalTransacciones : 0

    return {
      totalIngresos,
      ingresosHoy,
      totalTransacciones,
      promedioIngreso
    }
  }, [filtros])

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
          {totalIngresos.toFixed(2)}
        </div>
      </div>

      {/* Ingresos de Hoy */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCalendarDay className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Ingresos de Hoy</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {ingresosHoy.toFixed(2)}
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

      {/* Promedio por Ingreso */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaChartLine className='text-rose-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Promedio por Ingreso</div>
        </div>
        <div className='text-2xl font-bold text-rose-600 text-center'>
          {promedioIngreso.toFixed(2)}
        </div>
      </div>
    </div>
  )
}