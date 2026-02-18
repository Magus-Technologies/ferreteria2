'use client'

import { useRef, memo, useCallback, useMemo, useState, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ColDef, SelectionChangedEvent, RowDoubleClickedEvent, RowClickedEvent } from 'ag-grid-community'
import { useStoreFiltrosMisGastos } from '../../_store/store-filtros-mis-gastos'
import dayjs from 'dayjs'
import TableBase from '~/components/tables/table-base'

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

const TableMisGastos = memo(function TableMisGastos() {
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
    },
    {
      id: '5',
      fecha: '2024-02-14',
      monto: 320.75,
      destino: 'MANTENIMIENTO',
      motivo: 'Reparación de equipos',
      comprobante: 'EFRAIN',
      cajero: 'Carlos Ruiz',
      autoriza: 'María García',
      anulado: false
    }
  ]

  const filteredData = useMemo(() => {
    if (!filtros) return []

    let data = mockData

    if (filtros.fechaDesde) {
      data = data.filter(item => 
        dayjs(item.fecha).isAfter(dayjs(filtros.fechaDesde).subtract(1, 'day'))
      )
    }
    if (filtros.fechaHasta) {
      data = data.filter(item => 
        dayjs(item.fecha).isBefore(dayjs(filtros.fechaHasta).add(1, 'day'))
      )
    }
    if (filtros.motivoGasto) {
      data = data.filter(item => 
        item.motivo.toLowerCase().includes(filtros.motivoGasto!.toLowerCase())
      )
    }
    if (filtros.cajeroRegistra) {
      data = data.filter(item => 
        item.cajero.toLowerCase().includes(filtros.cajeroRegistra!.toLowerCase())
      )
    }
    if (filtros.busqueda) {
      const search = filtros.busqueda.toLowerCase()
      data = data.filter(item => 
        item.motivo.toLowerCase().includes(search) ||
        item.destino.toLowerCase().includes(search) ||
        item.cajero.toLowerCase().includes(search) ||
        item.autoriza.toLowerCase().includes(search)
      )
    }

    return data
  }, [filtros])

  // Definir columnas según la imagen
  const columns: ColDef<Gasto>[] = useMemo(() => [
    {
      headerName: 'FECHA',
      field: 'fecha',
      width: 100,
      valueFormatter: (params) => {
        if (!params.value) return ''
        return dayjs(params.value).format('DD/MM/YYYY')
      },
      sort: 'desc',
    },
    {
      headerName: 'MONTO',
      field: 'monto',
      width: 100,
      cellRenderer: (params: any) => {
        const monto = Number(params.value || 0)
        return `<span class="font-semibold text-rose-600">S/. ${monto.toFixed(2)}</span>`
      },
      type: 'numericColumn',
    },
    {
      headerName: 'DESTINO',
      field: 'destino',
      width: 150,
      flex: 1,
    },
    {
      headerName: 'MOTIVO',
      field: 'motivo',
      width: 250,
      flex: 1,
    },
    {
      headerName: 'COMPROBANTE',
      field: 'comprobante',
      width: 120,
    },
    {
      headerName: 'CAJERO',
      field: 'cajero',
      width: 120,
    },
    {
      headerName: 'AUTORIZA',
      field: 'autoriza',
      width: 120,
    },
    {
      headerName: 'ESTADO',
      field: 'anulado',
      width: 80,
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
      <TableBase<Gasto>
        columnDefs={columns}
        rowData={filteredData}
        getRowId={getRowId}
        headerColor='var(--color-rose-600)'
        selectionColor='#fef2f2'
        pagination={false}
        suppressRowClickSelection={false}
        rowSelection={true}
        tableKey='mis-gastos'
      />
    </div>
  )
})

export default TableMisGastos