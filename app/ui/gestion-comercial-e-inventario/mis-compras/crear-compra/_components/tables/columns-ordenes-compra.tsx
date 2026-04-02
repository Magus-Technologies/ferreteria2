import { useMemo } from 'react'
import { type ColDef } from 'ag-grid-community'
import { type OrdenCompra } from '~/lib/api/orden-compra'
import { toLocalString } from '~/utils/fechas'
import dayjs from 'dayjs'

const estadoLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  en_proceso: 'En Proceso',
  completada: 'Completada',
  anulada: 'Anulada',
}

export const useColumnsOrdenesCompra = (): ColDef<OrdenCompra>[] => {
  return useMemo(
    () => [
      {
        headerName: '#',
        valueGetter: 'node.rowIndex + 1',
        width: 60,
        cellStyle: { textAlign: 'center' },
        pinned: 'left',
      },
      {
        headerName: 'Código',
        field: 'codigo',
        width: 120,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Fecha',
        field: 'fecha',
        width: 120,
        valueFormatter: params =>
          params.value
            ? toLocalString({ date: dayjs(params.value), format: 'DD/MM/YYYY' })
            : '',
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Proveedor',
        field: 'proveedor.razon_social',
        width: 250,
        valueGetter: params => params.data?.proveedor?.razon_social || '-',
      },
      {
        headerName: 'RUC',
        field: 'proveedor.ruc',
        width: 120,
        valueGetter: params => params.data?.proveedor?.ruc || '-',
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Moneda',
        field: 'tipo_moneda',
        width: 100,
        valueFormatter: params => (params.value === 's' ? 'Soles' : 'Dólares'),
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Total',
        field: 'total',
        width: 120,
        valueFormatter: params => {
          const total = params.value || 0
          const symbol = params.data?.tipo_moneda === 's' ? 'S/' : '$'
          return `${symbol} ${total.toFixed(2)}`
        },
        cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      },
      {
        headerName: 'Estado',
        field: 'estado',
        width: 120,
        valueFormatter: params => estadoLabels[params.value] || params.value,
        cellStyle: { textAlign: 'center' },
      },
      {
        headerName: 'Productos',
        field: 'productos_count',
        width: 100,
        valueFormatter: params => String(params.value || 0),
        cellStyle: { textAlign: 'center' },
      },
    ] as ColDef<OrdenCompra>[],
    []
  )
}
