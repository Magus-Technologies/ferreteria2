'use client'

import { useState } from 'react'
import { Spin } from 'antd'
import { FaTriangleExclamation, FaCircleCheck, FaCircleInfo, FaXmark, FaChevronUp, FaChevronDown } from 'react-icons/fa6'
import { ProveedorCalificacion, EstadoProveedorCalificacion } from '~/lib/api/proveedor-calificacion'

interface FloatingCalificacionProveedorProps {
  calificacion: ProveedorCalificacion | null | undefined
  loading: boolean
  proveedorId: number | undefined
}

const estadoLabel: Record<EstadoProveedorCalificacion, string> = {
  [EstadoProveedorCalificacion.EXCELENTE]: 'Excelente',
  [EstadoProveedorCalificacion.BUENO]: 'Bueno',
  [EstadoProveedorCalificacion.REGULAR]: 'Regular',
  [EstadoProveedorCalificacion.PROBLEMATICO]: 'Problemático',
}

function getConfig(estado: EstadoProveedorCalificacion) {
  switch (estado) {
    case EstadoProveedorCalificacion.EXCELENTE:
      return {
        icon: <FaCircleCheck className="text-green-600" size={18} />,
        bg: 'bg-green-50',
        border: 'border-green-300',
        text: 'text-green-800',
        header: 'bg-green-100',
      }
    case EstadoProveedorCalificacion.BUENO:
      return {
        icon: <FaCircleInfo className="text-blue-600" size={18} />,
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-800',
        header: 'bg-blue-100',
      }
    case EstadoProveedorCalificacion.REGULAR:
      return {
        icon: <FaTriangleExclamation className="text-yellow-600" size={18} />,
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-800',
        header: 'bg-yellow-100',
      }
    case EstadoProveedorCalificacion.PROBLEMATICO:
      return {
        icon: <FaTriangleExclamation className="text-red-600" size={18} />,
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-800',
        header: 'bg-red-100',
      }
    default:
      return {
        icon: <FaCircleInfo className="text-gray-600" size={18} />,
        bg: 'bg-gray-50',
        border: 'border-gray-300',
        text: 'text-gray-800',
        header: 'bg-gray-100',
      }
  }
}

export default function FloatingCalificacionProveedor({
  calificacion,
  loading,
  proveedorId,
}: FloatingCalificacionProveedorProps) {
  const [closed, setClosed] = useState<number | null>(null)
  const [minimized, setMinimized] = useState(false)

  if (!proveedorId) return null
  if (closed === proveedorId) return null
  if (!loading && !calificacion) return null

  const config = calificacion ? getConfig(calificacion.estado) : getConfig(EstadoProveedorCalificacion.BUENO)

  return (
    <div
      className={`fixed top-20 right-4 z-[1000] w-72 rounded-lg shadow-xl border ${config.border} ${config.bg}`}
    >
      <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-t-lg ${config.header}`}>
        <div className="flex items-center gap-2 min-w-0">
          {loading ? <Spin size="small" /> : config.icon}
          <span className={`font-semibold text-sm truncate ${config.text}`}>
            {loading ? 'Cargando calificación...' : `Calificación: ${estadoLabel[calificacion!.estado]}`}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMinimized(v => !v)}
            className={`p-1 rounded hover:bg-white/50 ${config.text}`}
            aria-label={minimized ? 'Expandir' : 'Minimizar'}
          >
            {minimized ? <FaChevronDown size={12} /> : <FaChevronUp size={12} />}
          </button>
          <button
            type="button"
            onClick={() => setClosed(proveedorId)}
            className={`p-1 rounded hover:bg-white/50 ${config.text}`}
            aria-label="Cerrar"
          >
            <FaXmark size={12} />
          </button>
        </div>
      </div>

      {!minimized && !loading && calificacion && (
        <div className="p-3 space-y-2 text-sm">
          {calificacion.razon && (
            <p className="text-gray-700">
              <span className="font-medium">Razón:</span> {calificacion.razon}
            </p>
          )}
          {calificacion.observacion && (
            <p className="text-gray-700">
              <span className="font-medium">Observación:</span> {calificacion.observacion}
            </p>
          )}
          {calificacion.createdBy && (
            <p className="text-xs text-gray-500">
              Registrado por: {calificacion.createdBy.name}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
