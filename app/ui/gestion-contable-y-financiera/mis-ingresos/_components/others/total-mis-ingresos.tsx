'use client'

import { useMemo } from 'react'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import dayjs from 'dayjs'

// Mock interface for Ingresos
interface Ingreso {
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

export default function TotalMisIngresos() {
  const filtros = useStoreFiltrosMisIngresos(state => state.filtros)

  // Mock data - replace with actual API call
  const mockData: Ingreso[] = [
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
      motivo: 'Ingresos de transporte',
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

  const totalIngresos = useMemo(() => {
    if (!filtros) return 0

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

    // Solo Ingresos no anulados
    const IngresosValidos = filteredData.filter(item => !item.anulado)

    return IngresosValidos.reduce((sum, item) => sum + item.monto, 0)
  }, [filtros])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <div className='flex items-center justify-between bg-white p-4 rounded-lg border'>
      <div className='flex items-center gap-4'>
        <span className='text-lg font-semibold text-gray-700'>Total:</span>
        <span className='text-2xl font-bold text-rose-600'>
          {totalIngresos.toFixed(2)}
        </span>
      </div>

      <div className='flex items-center gap-2 text-sm text-gray-600'>
        <span>Correo:</span>
        <span className='text-blue-600 font-medium'>GRUPOMIREDENTORSAC@GMAIL.COM</span>
      </div>
    </div>
  )
}
