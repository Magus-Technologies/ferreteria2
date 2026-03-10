'use client'

import { Tooltip, Spin } from 'antd'
import { FaTriangleExclamation, FaCircleCheck, FaCircleInfo } from 'react-icons/fa6'
import { ClienteCalificacion, EstadoClienteCalificacion } from '~/lib/api/cliente-calificacion'

interface TooltipCalificacionClienteProps {
  calificacion: ClienteCalificacion | null | undefined
  loading: boolean
  children: React.ReactNode
}

export default function TooltipCalificacionCliente({
  calificacion,
  loading,
  children,
}: TooltipCalificacionClienteProps) {
  // Determinar tipo de alerta según estado
  const getAlertConfig = (estado: EstadoClienteCalificacion) => {
    switch (estado) {
      case EstadoClienteCalificacion.EXCELENTE:
        return {
          icon: <FaCircleCheck className="text-green-600" size={16} />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-800',
          tagColor: 'green',
        }
      case EstadoClienteCalificacion.BUENO:
        return {
          icon: <FaCircleInfo className="text-blue-600" size={16} />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-300',
          textColor: 'text-blue-800',
          tagColor: 'blue',
        }
      case EstadoClienteCalificacion.REGULAR:
        return {
          icon: <FaTriangleExclamation className="text-yellow-600" size={16} />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-800',
          tagColor: 'orange',
        }
      case EstadoClienteCalificacion.PROBLEMATICO:
        return {
          icon: <FaTriangleExclamation className="text-red-600" size={16} />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-800',
          tagColor: 'red',
        }
      default:
        return {
          icon: <FaCircleInfo className="text-gray-600" size={16} />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-300',
          textColor: 'text-gray-800',
          tagColor: 'default',
        }
    }
  }

  const estadoLabel = {
    [EstadoClienteCalificacion.EXCELENTE]: 'Excelente',
    [EstadoClienteCalificacion.BUENO]: 'Bueno',
    [EstadoClienteCalificacion.REGULAR]: 'Regular',
    [EstadoClienteCalificacion.PROBLEMATICO]: 'Problemático',
  }[calificacion?.estado || EstadoClienteCalificacion.BUENO]

  // Contenido del tooltip
  const tooltipContent = loading ? (
    <div className="flex items-center gap-2">
      <Spin size="small" />
      <span className="text-sm">Cargando calificación...</span>
    </div>
  ) : calificacion ? (
    (() => {
      const config = getAlertConfig(calificacion.estado)
      return (
        <div className={`space-y-2 max-w-xs p-3 rounded ${config.bgColor} border ${config.borderColor}`}>
          <div className="flex items-center gap-2">
            {config.icon}
            <span className={`font-semibold ${config.textColor}`}>
              {estadoLabel}
            </span>
          </div>

          {calificacion.razon && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Razón:</span> {calificacion.razon}
            </p>
          )}

          {calificacion.observacion && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Observación:</span> {calificacion.observacion}
            </p>
          )}

          {calificacion.createdBy && (
            <p className="text-xs text-gray-600 opacity-75">
              Registrado por: {calificacion.createdBy.name}
            </p>
          )}
        </div>
      )
    })()
  ) : (
    <div className="text-sm text-gray-600">
      Sin calificación registrada
    </div>
  )

  return (
    <Tooltip 
      title={tooltipContent} 
      color="white"
      overlayClassName="tooltip-calificacion-cliente"
      overlayStyle={{
        maxWidth: '320px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div style={{ width: '30%' }}>
        {children}
      </div>
    </Tooltip>
  )
}
