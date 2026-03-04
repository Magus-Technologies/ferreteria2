'use client'

import { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import CellAccionesGuia from './cell-acciones-guia'

export function useColumnsMisGuias(onRefetch?: () => void) {
  const columnDefs: ColDef<any>[] = [
    {
      headerName: 'Serie-Número',
      colId: 'serie_numero',
      field: 'serie',
      width: 150,
      pinned: 'left',
      valueGetter: (params) => {
        const serie = params.data?.serie || 'S/N'
        const numero = params.data?.numero || ''
        return numero ? `${serie}-${numero}` : serie
      },
    },
    {
      headerName: 'Fecha Emisión',
      field: 'fecha_emision',
      width: 130,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-',
    },
    {
      headerName: 'Fecha Traslado',
      field: 'fecha_traslado',
      width: 130,
      valueFormatter: (params) =>
        params.value ? dayjs(params.value).format('DD/MM/YYYY') : '-',
    },
    {
      headerName: 'Cliente',
      colId: 'cliente_nombre',
      field: 'cliente',
      width: 300,
      valueGetter: (params) => {
        const cliente = params.data?.cliente
        if (!cliente) return 'SIN CLIENTE'
        
        const nombre = cliente.razon_social || 
          `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
        const documento = cliente.numero_documento || ''
        
        return documento ? `${documento} - ${nombre}` : nombre
      },
    },
    {
      headerName: 'Motivo',
      colId: 'motivo_traslado',
      field: 'motivo_traslado',
      width: 200,
      valueGetter: (params) => {
        const motivo = params.data?.motivo_traslado
        if (!motivo) return '-'
        return `${motivo.codigo} - ${motivo.descripcion}`
      },
    },
    {
      headerName: 'Tipo',
      field: 'tipo_guia',
      width: 180,
      valueFormatter: (params) => {
        const tipo = params.value
        if (tipo === 'ELECTRONICA_REMITENTE') return '📧 E-Remitente'
        if (tipo === 'ELECTRONICA_TRANSPORTISTA') return '🚚 E-Transportista'
        if (tipo === 'FISICA') return '📄 Física'
        return tipo || ''
      },
    },
    {
      headerName: 'Modalidad',
      field: 'modalidad_transporte',
      width: 120,
      valueFormatter: (params) => {
        const modalidad = params.value
        if (modalidad === 'PRIVADO') return '🚗 Privado'
        if (modalidad === 'PUBLICO') return '🚌 Público'
        return modalidad || ''
      },
    },
    {
      headerName: 'Estado',
      field: 'estado',
      width: 120,
      valueFormatter: (params) => {
        const estado = params.value
        if (estado === 'BORRADOR') return '📝 Borrador'
        if (estado === 'EMITIDA') return '✅ Emitida'
        if (estado === 'ANULADA') return '❌ Anulada'
        return estado || ''
      },
    },
    {
      headerName: 'Referencia',
      field: 'referencia',
      flex: 1,
      minWidth: 150,
      valueFormatter: (params) => params.value || '-',
    },
    {
      headerName: 'Acciones',
      field: 'id',
      width: 150,
      pinned: 'right',
      cellRenderer: CellAccionesGuia,
      cellRendererParams: (params: { data?: any }) => ({
        guia: params.data,
        onRefetch,
      }),
    },
  ]

  return columnDefs
}
