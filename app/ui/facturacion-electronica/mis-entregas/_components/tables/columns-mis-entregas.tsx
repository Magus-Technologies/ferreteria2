'use client'

import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import CellAccionesEntrega from './cell-acciones-entrega'

export function useColumnsMisEntregas(onRefetch?: () => void) {
  const columnDefs: ColDef<any>[] = [
    {
      headerName: 'N° Venta',
      colId: 'venta_numero',
      field: 'venta.serie',
      width: 150,
      valueGetter: (params) => {
        const venta = params.data?.venta
        if (!venta) return '-'
        const serie = venta.serie || ''
        const numero = venta.numero || ''
        return serie && numero ? `${serie}-${numero}` : '-'
      },
    },
    {
      headerName: 'Cliente',
      colId: 'cliente_nombre',
      field: 'venta.cliente',
      width: 300,
      valueGetter: (params) => {
        const cliente = params.data?.venta?.cliente
        if (!cliente) return 'SIN CLIENTE'
        
        const nombre = cliente.razon_social || 
          `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
        const documento = cliente.numero_documento || ''
        
        return documento ? `${documento} - ${nombre}` : nombre
      },
    },
    {
      headerName: 'Dirección',
      field: 'direccion_entrega',
      width: 250,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Fecha Programada',
      field: 'fecha_programada',
      width: 150,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-',
    },
    {
      headerName: 'Horario',
      colId: 'horario',
      field: 'hora_inicio',
      width: 120,
      valueGetter: (params) => {
        const horaInicio = params.data?.hora_inicio
        const horaFin = params.data?.hora_fin
        if (horaInicio && horaFin) {
          return `${horaInicio} - ${horaFin}`
        }
        return '-'
      },
    },
    {
      headerName: 'Tipo Despacho',
      field: 'tipo_despacho',
      width: 130,
      valueFormatter: (params) => {
        const tipo = params.value
        if (tipo === 'in') return '⚡ Inmediato'
        if (tipo === 'pr') return '📅 Programado'
        return tipo || ''
      },
    },
    {
      headerName: 'Estado',
      field: 'estado_entrega',
      width: 130,
      valueFormatter: (params) => {
        const estado = params.value
        if (estado === 'pe') return '⏳ Pendiente'
        if (estado === 'ec') return '🚚 En Camino'
        if (estado === 'en') return '✅ Entregado'
        if (estado === 'ca') return '❌ Cancelado'
        return estado || ''
      },
    },
    {
      headerName: 'Observaciones',
      field: 'observaciones',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 120,
      pinned: 'right',
      cellRenderer: CellAccionesEntrega,
      cellRendererParams: (params: { data?: any }) => ({
        entrega: params.data,
        onRefetch,
      }),
    },
  ]

  return columnDefs
}
