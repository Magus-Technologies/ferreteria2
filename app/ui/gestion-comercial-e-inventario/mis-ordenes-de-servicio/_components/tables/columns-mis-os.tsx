'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tag, Tooltip } from 'antd'
import { FaEye, FaCheck } from 'react-icons/fa'
import { FilePdfFilled } from '@ant-design/icons'
import dayjs from 'dayjs'
import { type RequerimientoInterno } from '~/lib/api/requerimiento-interno'

const PRIORIDAD_COLORS: Record<string, string> = {
  BAJA: 'blue',
  MEDIA: 'orange',
  ALTA: 'red',
  URGENTE: 'volcano',
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: 'processing',
  aprobado: 'success',
  rechazado: 'error',
  anulado: 'default',
}

export function useColumnsMisOS({
  onView,
  onViewPdf,
  onAprobar,
}: {
  onView: (row: RequerimientoInterno) => void
  onViewPdf: (row: RequerimientoInterno) => void
  onAprobar?: (row: RequerimientoInterno) => void
}) {
  const columns: ColDef<RequerimientoInterno>[] = [
    {
      colId: 'codigo',
      headerName: 'Código',
      field: 'codigo',
      width: 130,
      minWidth: 130,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full font-bold text-emerald-600">
          {data?.codigo}
        </div>
      ),
    },
    {
      colId: 'titulo',
      headerName: 'Título',
      field: 'titulo',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <Tooltip title={data?.titulo}>
          <div className="flex items-center h-full overflow-hidden text-ellipsis whitespace-nowrap">
            {data?.titulo}
          </div>
        </Tooltip>
      ),
    },
    {
      colId: 'area',
      headerName: "Cargo / Ocupación",
      field: "cargo",
      flex: 1,
      minWidth: 150,
    },
    {
      colId: 'prioridad',
      headerName: 'Prioridad',
      field: 'prioridad',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full">
          <Tag color={PRIORIDAD_COLORS[data?.prioridad || 'MEDIA']}>
            {data?.prioridad}
          </Tag>
        </div>
      ),
    },
    {
      colId: 'estado',
      headerName: 'Estado',
      field: 'estado',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full">
          <Tag color={ESTADO_COLORS[data?.estado || 'pendiente']}>
            {data?.estado?.toUpperCase()}
          </Tag>
        </div>
      ),
    },
    {
      colId: 'created_at',
      headerName: 'Fecha Creación',
      field: 'created_at',
      width: 140,
      minWidth: 110,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full text-xs">
          {data?.created_at ? dayjs(data.created_at).format('DD/MM/YYYY HH:mm') : '—'}
        </div>
      ),
    },
    {
      colId: 'fecha_requerida',
      headerName: 'Fecha Requerida',
      field: 'fecha_requerida',
      width: 140,
      minWidth: 110,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full text-xs">
          {data?.fecha_requerida ? dayjs(data.fecha_requerida).format('DD/MM/YYYY') : '—'}
        </div>
      ),
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      field: 'id',
      width: 120,
      minWidth: 120,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center gap-3 h-full">
          <Tooltip title="Ver detalles">
            <FaEye
              onClick={() => data && onView(data)}
              className="cursor-pointer hover:scale-110 transition-all text-blue-600"
              size={16}
            />
          </Tooltip>
          <Tooltip title="Ver PDF">
            <FilePdfFilled
              onClick={() => data && onViewPdf(data)}
              className="cursor-pointer hover:scale-110 transition-all"
              style={{ fontSize: 16, color: '#dc2626' }}
            />
          </Tooltip>
          {data?.estado === 'pendiente' && (
            <Tooltip title="Aprobar">
              <FaCheck
                onClick={() => data && onAprobar?.(data)}
                className="cursor-pointer hover:scale-110 transition-all text-green-600"
                size={16}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  return columns
}
