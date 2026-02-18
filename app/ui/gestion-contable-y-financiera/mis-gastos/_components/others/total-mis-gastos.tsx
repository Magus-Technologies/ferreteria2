'use client'

import { useMemo } from 'react'
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

export default function TotalMisGastos() {
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

  const totalGastos = useMemo(() => {
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

    // Solo gastos no anulados
    const gastosValidos = filteredData.filter(item => !item.anulado)
    
    return gastosValidos.reduce((sum, item) => sum + item.monto, 0)
  }, [filtros])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <div className='flex items-center justify-between bg-white p-4 rounded-lg border'>
      <div className='flex items-center gap-4'>
        <span className='text-lg font-semibold text-gray-700'>Total:</span>
        <span className='text-2xl font-bold text-rose-600'>
          {totalGastos.toFixed(2)}
        </span>
      </div>
      
      <div className='flex items-center gap-2 text-sm text-gray-600'>
        <span>Correo:</span>
        <span className='text-blue-600 font-medium'>GRUPOMIREDENTORSAC@GMAIL.COM</span>
      </div>
    </div>
  )
}