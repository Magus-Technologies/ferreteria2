'use client'

import { Event } from 'react-big-calendar'

export interface EntregaEvent extends Event {
  id: number
  title: string
  start: Date
  end: Date
  resource: {
    venta_id: string
    chofer_id: string
    chofer_nombre: string
    vehiculo_id?: number
    vehiculo_nombre: string
    cliente_nombre: string
    direccion: string
    productos_count: number
    productos_detallado?: Array<{
      producto: string
      codigo?: string
      cantidad: number | string
      unidad?: string
      unidad_medida?: string
      marca?: string
    }>
    color: string
    venta_nro?: string
  }
}

interface EventEntregaProps {
  event: EntregaEvent
}

export default function EventEntrega({ event }: EventEntregaProps) {
  const isTemporary = event.id === -1

  const isLightBackground =
    event.resource.color === '#f59e0b' ||
    event.resource.color === '#22c55e' ||
    event.resource.color === '#3b82f6'

  if (isTemporary) {
    return (
      <div
        className="h-full w-full p-1.5 overflow-hidden rounded"
        style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: '#ffffff',
          fontWeight: '600',
          border: '2px dashed #60a5fa',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        }}
      >
        <div className="font-bold truncate text-[12px] leading-tight mb-0.5">
          📅 Horario seleccionado
        </div>
        <div className="text-[11px] leading-tight opacity-90">
          Arrastra para ajustar
        </div>
      </div>
    )
  }

  const isEntregado = event.resource.color === '#22c55e'
  const isEnCamino = event.resource.color === '#3b82f6'
  const isPendiente = event.resource.color === '#f59e0b'
  const isCancelado = event.resource.color === '#ef4444'

  return (
    <div
      className="h-full w-full p-1.5 overflow-hidden rounded"
      style={{
        background: isEntregado
          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
          : isEnCamino
          ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
          : isPendiente
          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
          : isCancelado
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
          : `linear-gradient(135deg, ${event.resource.color} 0%, ${adjustColor(event.resource.color, -20)} 100%)`,
        color: isLightBackground ? '#1f2937' : '#ffffff',
        fontWeight: '600',
        border: `1px solid ${adjustColor(event.resource.color, -30)}`,
        boxShadow: isEntregado
          ? '0 4px 12px rgba(34, 197, 94, 0.35)'
          : isEnCamino
          ? '0 4px 12px rgba(59, 130, 246, 0.35)'
          : isPendiente
          ? '0 4px 12px rgba(245, 158, 11, 0.35)'
          : isCancelado
          ? '0 4px 12px rgba(239, 68, 68, 0.35)'
          : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div className="font-bold truncate text-[12px] leading-tight mb-0.5">
        {event.resource.venta_nro || event.resource.vehiculo_nombre}
      </div>
      <div className="truncate text-[11px] leading-tight mb-0.5 text-white/95">
        {event.resource.cliente_nombre}
      </div>
      <div className="text-[10px] leading-tight truncate text-white/85 flex items-center gap-1">
        <span>{event.resource.vehiculo_nombre}</span>
        {isEntregado && <span className="text-[10px] ml-auto">✓</span>}
        {isEnCamino && <span className="text-[10px] ml-auto">🚚</span>}
        {isPendiente && <span className="text-[10px] ml-auto">⏳</span>}
        {isCancelado && <span className="text-[10px] ml-auto">✕</span>}
      </div>
      <div className="text-[10px] leading-tight truncate text-white/85">
        📦 {event.resource.productos_count} prod.
      </div>
    </div>
  )
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
