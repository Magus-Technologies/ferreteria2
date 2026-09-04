'use client'

import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Tag, Tooltip } from 'antd'
import { FaEye, FaCheck, FaArrowUp, FaExchangeAlt, FaUndo, FaTimes } from 'react-icons/fa'
import { FilePdfFilled } from '@ant-design/icons'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
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
  onDesaprobar,
  onRechazar,
  onEscalar,
  onReasignar,
  userCargoId,
  esRootCargo = false,
}: {
  onView: (row: RequerimientoInterno) => void
  onViewPdf: (row: RequerimientoInterno) => void
  onAprobar?: (row: RequerimientoInterno) => void
  onDesaprobar?: (row: RequerimientoInterno) => void
  onRechazar?: (row: RequerimientoInterno) => void
  onEscalar?: (row: RequerimientoInterno) => void
  onReasignar?: (row: RequerimientoInterno) => void
  userCargoId?: string
  esRootCargo?: boolean
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
      width: 200,
      minWidth: 150,
    },
    {
      colId: 'vehiculo',
      headerName: 'Vehículo',
      width: 180,
      minWidth: 140,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full text-xs">
          {data?.vehiculo ? `${data.vehiculo.name}${data.vehiculo.placa ? ` (${data.vehiculo.placa})` : ''}` : '—'}
        </div>
      ),
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
      hide: true,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full">
          <Tag color={ESTADO_COLORS[data?.estado || 'pendiente']}>
            {data?.estado?.toUpperCase()}
          </Tag>
        </div>
      ),
    },
    {
      colId: 'approval_state',
      headerName: 'Aprobación',
      field: 'approval_state',
      width: 120,
      minWidth: 100,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => {
        const stateColors: Record<string, string> = {
          pendiente: 'warning',
          en_revision: 'processing',
          aprobado: 'success',
          rechazado: 'error',
        }
        return (
          <div className="flex items-center h-full">
            <Tag color={stateColors[data?.approval_state || 'pendiente']}>
              {data?.approval_state?.replace('_', ' ').toUpperCase() || 'PENDIENTE'}
            </Tag>
          </div>
        )
      },
    },
    {
      colId: 'created_at',
      headerName: 'Fecha Creación',
      field: 'created_at',
      width: 140,
      minWidth: 110,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => (
        <div className="flex items-center h-full text-xs">
          {formatFechaPeru(data?.created_at, 'DD/MM/YYYY HH:mm') || '—'}
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
      width: 185,
      minWidth: 185,
      cellRenderer: ({ data }: ICellRendererParams<RequerimientoInterno>) => {
        // Verificar si el usuario tiene autoridad para aprobar
        // El usuario puede aprobar si su cargo coincide con el cargo requerido en la OS (case-insensitive)
        const canApprove = esRootCargo || (userCargoId && data?.cargo && userCargoId.toLowerCase() === data.cargo.toLowerCase())
        const isApprovalPending = data?.approval_state === 'pendiente' || data?.approval_state === 'en_revision'
        const isAprobado = data?.approval_state === 'aprobado'
        const isRechazado = data?.approval_state === 'rechazado'

        return (
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
            {/* Pendiente: Aprobar + Desaprobar + Rechazar activos (los tres).
                Aprobada: se apaga Aprobar (ya está), quedan Desaprobar + Rechazar.
                Rechazada: estado terminal, nada de esto queda activo — solo
                Ver y Ver PDF. Desaprobar YA NO depende de `isAprobado`: antes
                solo se habilitaba si ya estaba aprobada, pero en pendiente
                también debe poder usarse (ej. para limpiar un estado inconsistente). */}
            <Tooltip title={
              isRechazado
                ? 'Está rechazada — no se puede aprobar'
                : isAprobado
                  ? 'Ya está aprobada'
                  : (canApprove ? 'Aprobar' : 'No tienes autoridad para aprobar')
            }>
              <FaCheck
                onClick={() => canApprove && !isAprobado && !isRechazado && data && onAprobar?.(data)}
                className={`transition-all ${
                  canApprove && !isAprobado && !isRechazado
                    ? 'cursor-pointer hover:scale-110 text-green-600'
                    : 'cursor-not-allowed text-gray-300'
                }`}
                size={16}
              />
            </Tooltip>
            <Tooltip title={
              isRechazado
                ? 'Está rechazada — no se puede desaprobar'
                : (canApprove ? 'Desaprobar (vuelve a pendiente)' : 'No tienes autoridad para desaprobar')
            }>
              <FaUndo
                onClick={() => canApprove && !isRechazado && data && onDesaprobar?.(data)}
                className={`transition-all ${
                  canApprove && !isRechazado
                    ? 'cursor-pointer hover:scale-110 text-rose-600'
                    : 'cursor-not-allowed text-gray-300'
                }`}
                size={15}
              />
            </Tooltip>
            <Tooltip title={
              isRechazado
                ? 'Ya está rechazada'
                : (canApprove ? 'Rechazar (requiere motivo)' : 'No tienes autoridad para rechazar')
            }>
              <FaTimes
                onClick={() => canApprove && !isRechazado && data && onRechazar?.(data)}
                className={`transition-all ${
                  canApprove && !isRechazado
                    ? 'cursor-pointer hover:scale-110 text-red-600'
                    : 'cursor-not-allowed text-gray-300'
                }`}
                size={16}
              />
            </Tooltip>
            <Tooltip title={
              isApprovalPending
                ? (canApprove ? 'Escalar a superior' : 'No tienes autoridad para escalar')
                : 'La OS ya fue aprobada o rechazada'
            }>
              <FaArrowUp
                onClick={() => isApprovalPending && canApprove && data && onEscalar?.(data)}
                className={`transition-all ${
                  isApprovalPending && canApprove
                    ? 'cursor-pointer hover:scale-110 text-orange-600'
                    : 'cursor-not-allowed text-gray-300'
                }`}
                size={16}
              />
            </Tooltip>
            <Tooltip title={
              isApprovalPending
                ? 'Reasignar a otro cargo'
                : 'La OS ya fue aprobada o rechazada'
            }>
              <FaExchangeAlt
                onClick={() => isApprovalPending && esRootCargo && data && onReasignar?.(data)}
                className={`transition-all ${
                  isApprovalPending && esRootCargo
                    ? 'cursor-pointer hover:scale-110 text-indigo-600'
                    : 'cursor-not-allowed text-gray-300'
                }`}
                size={16}
              />
            </Tooltip>
          </div>
        )
      },
    },
  ]

  return columns
}
