'use client'

import { ColDef } from 'ag-grid-community'
import { Tag, Tooltip } from 'antd'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
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
      width: 180,
      valueFormatter: (params) =>
        params.value ? formatFechaPeru(params.value, 'DD/MM/YYYY hh:mm:ss A') : '-',
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
      // Estado ante SUNAT. La columna "Estado" de al lado es el estado INTERNO
      // (borrador/emitida/anulada) y no dice nada de SUNAT: hasta ahora no
      // había forma de ver desde la lista si una guía fue aceptada, rechazada
      // o sigue con un ticket en curso.
      headerName: 'SUNAT',
      field: 'sunat_estado',
      width: 150,
      cellRenderer: (params: any) => {
        const guia = params.data
        if (!guia) return null

        // Las físicas no se declaran.
        if (guia.tipo_guia === 'FISICA') {
          return <span className="text-slate-400">No aplica</span>
        }

        const estado: string | null = guia.sunat_estado
        const observaciones: string[] = guia.sunat_observaciones ?? []

        if (!estado) {
          return <Tag color="default">Sin enviar</Tag>
        }

        const color =
          estado === 'ACEPTADO'
            ? 'success'
            : estado === 'RECHAZADO'
              ? 'error'
              : estado === 'PENDIENTE'
                ? 'warning'
                : 'default'

        const etiqueta =
          estado === 'PENDIENTE' ? 'Procesando' : estado.charAt(0) + estado.slice(1).toLowerCase()

        // Aceptada CON observaciones: SUNAT igual la aceptó (código 0), así que
        // el tag sigue en verde. El ⚠ avisa que hay avisos del CDR —
        // típicamente placa o licencia que no encontró en las bases del MTC.
        if (observaciones.length > 0) {
          return (
            <Tooltip
              title={
                <div className="flex flex-col gap-1">
                  <strong>Observaciones de SUNAT:</strong>
                  {observaciones.map((obs, i) => (
                    <span key={i}>• {obs}</span>
                  ))}
                </div>
              }
            >
              <Tag color={color} className="cursor-help">
                {etiqueta} ⚠ {observaciones.length}
              </Tag>
            </Tooltip>
          )
        }

        return guia.sunat_mensaje ? (
          <Tooltip title={guia.sunat_mensaje}>
            <Tag color={color} className="cursor-help">
              {etiqueta}
            </Tag>
          </Tooltip>
        ) : (
          <Tag color={color}>{etiqueta}</Tag>
        )
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
      // Mismo ancho que mis-ventas: ahora es un solo botón de dropdown, no
      // una fila de botones sueltos.
      width: 110,
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
