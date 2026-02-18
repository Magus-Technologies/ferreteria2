'use client'

import { useMemo, useCallback } from 'react'
import { useStoreFiltrosMisIngresos } from '../../_store/store-filtros-mis-ingresos'
import dayjs from 'dayjs'
import TableBase from '~/components/tables/table-base'
import { ColDef } from 'ag-grid-community'

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

export default function TableMisIngresos() {
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

  const filteredData = useMemo(() => {
    if (!filtros) return []

    let data = mockData

    // Aplicar filtros de fecha
    if (filtros.fecha?.gte) {
      data = data.filter(item => 
        dayjs(item.fecha).isAfter(dayjs(filtros.fecha?.gte).subtract(1, 'day'))
      )
    }
    if (filtros.fecha?.lte) {
      data = data.filter(item => 
        dayjs(item.fecha).isBefore(dayjs(filtros.fecha?.lte).add(1, 'day'))
      )
    }

    // Aplicar filtros de búsqueda
    if (filtros.OR) {
      // Implementar lógica de búsqueda si es necesario
    }

    return data
  }, [filtros])

  const columns: ColDef<Ingreso>[] = useMemo(() => [
    {
      headerName: 'Fecha',
      field: 'fecha',
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return ''
        return dayjs(params.value).format('DD/MM/YYYY')
      },
      sort: 'desc',
    },
    {
      headerName: 'Monto',
      field: 'monto',
      width: 140,
      cellRenderer: (params: any) => {
        const monto = Number(params.value || 0)
        return `<span class="font-semibold text-rose-600">S/. ${monto.toFixed(2)}</span>`
      },
      type: 'numericColumn',
    },
    {
      headerName: 'Concepto',
      field: 'concepto',
      width: 200,
      flex: 1,
    },
    {
      headerName: 'Comentario',
      field: 'comentario',
      width: 250,
      flex: 1,
    },
    {
      headerName: 'Cajero',
      field: 'cajero',
      width: 150,
    },
    {
      headerName: 'Autoriza',
      field: 'autoriza',
      width: 150,
    },
    {
      headerName: 'Estado',
      field: 'anulado',
      width: 100,
      cellRenderer: (params: any) => {
        const anulado = Boolean(params.value)
        const className = anulado
          ? 'bg-red-100 text-red-800'
          : 'bg-green-100 text-green-800'
        const texto = anulado ? 'Anulado' : 'Activo'
        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${className}">${texto}</span>`
      },
    },
  ], [])

  const getRowId = useCallback((params: any) => params.data.id, [])

  // Solo renderizar cuando hay filtros
  if (!filtros) return null

  return (
    <div className='h-full'>
      <TableBase<Ingreso>
        columnDefs={columns}
        rowData={filteredData}
        getRowId={getRowId}
        headerColor='var(--color-rose-600)'
        selectionColor='#fef2f2'
        pagination={false}
        suppressRowClickSelection={false}
        rowSelection={true}
        tableKey='mis-ingresos'
      />
    </div>
  )
}