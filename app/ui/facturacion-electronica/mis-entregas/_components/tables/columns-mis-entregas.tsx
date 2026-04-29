'use client'

import { ColDef } from 'ag-grid-community'
import { formatFechaPeru } from '~/utils/fechas'
import CellAccionesEntrega from './cell-acciones-entrega'

export function useColumnsMisEntregas(onRefetch?: () => void) {
  const columnDefs: ColDef<any>[] = [
    {
      headerName: 'Registrada',
      colId: 'created_at',
      field: 'created_at',
      width: 200,
      sort: 'desc',
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
    },
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
      width: 250,
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
      headerName: 'Teléfono',
      colId: 'cliente_telefono',
      width: 130,
      valueGetter: (params) => {
        const cliente = params.data?.venta?.cliente
        return cliente?.telefono || '—'
      },
    },
    {
      headerName: 'Dirección',
      field: 'direccion_entrega',
      width: 250,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Referencia',
      field: 'referencia_entrega',
      width: 200,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Fecha Programada',
      field: 'fecha_programada',
      width: 150,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY') : '-',
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
      headerName: 'Tipo Entrega',
      field: 'tipo_entrega',
      width: 140,
      valueFormatter: (params) => {
        const tipo = params.value
        if (tipo === 'rt') return '🏪 Recojo Tienda'
        if (tipo === 'de') return '🏠 Despacho'
        if (tipo === 'pa') return '🔀 Parcial'
        return tipo || '—'
      },
      cellStyle: (params) => {
        const tipo = params.value
        if (tipo === 'rt') return { color: '#0284c7', fontWeight: 'bold' }
        if (tipo === 'de') return { color: '#7c3aed', fontWeight: 'bold' }
        if (tipo === 'pa') return { color: '#d97706', fontWeight: 'bold' }
        return null
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
        return tipo || '—'
      },
      cellStyle: (params) => {
        const tipo = params.value
        if (tipo === 'in') return { color: '#16a34a', fontWeight: 'bold' }
        if (tipo === 'pr') return { color: '#2563eb', fontWeight: 'bold' }
        return null
      },
    },
    {
      headerName: 'Tipo Pedido',
      field: 'tipo_pedido',
      width: 130,
      valueGetter: (params) => {
        const tipoPedido = params.data?.tipo_pedido
        const choferId = params.data?.chofer_id
        if (tipoPedido === 'externo' && !choferId) return 'Disponible'
        if (tipoPedido === 'externo' && choferId) return 'Aceptado'
        return 'Asignado'
      },
    },
    {
      headerName: 'Vehículo',
      colId: 'vehiculo',
      field: 'vehiculo',
      width: 160,
      valueGetter: (params) => {
        const vehiculo = params.data?.vehiculo
        if (!vehiculo) return '—'
        return `${vehiculo.name}${vehiculo.placa ? ` (${vehiculo.placa})` : ''}`
      },
    },
    {
      headerName: 'Estado',
      field: 'estado_entrega',
      width: 130,
      cellRenderer: (params: any) => {
        const estado = params.value
        const config: Record<string, { label: string; bg: string; text: string }> = {
          'pe': { label: 'Pendiente',  bg: '#f1f5f9', text: '#475569' },
          'ec': { label: 'En Camino',  bg: '#dbeafe', text: '#2563eb' },
          'en': { label: 'Entregado',  bg: '#dcfce7', text: '#16a34a' },
          'ca': { label: 'Cancelado',  bg: '#fee2e2', text: '#dc2626' },
        }
        const { label, bg, text } = config[estado] ?? { label: estado || '', bg: '#f1f5f9', text: '#475569' }
        return (
          <div className="flex items-center h-full">
            <span style={{ background: bg, color: text, fontWeight: 'bold', fontSize: '11px', padding: '2px 8px', borderRadius: '9999px' }}>
              {label}
            </span>
          </div>
        )
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
