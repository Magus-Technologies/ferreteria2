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
    color: string
    venta_nro?: string
  }
}

interface EventEntregaProps {
  event: EntregaEvent
}

export default function EventEntrega({ event }: EventEntregaProps) {
  const isTemporary = event.id === -1

  const isLightBackground = event.resource.color.includes('#86efac') ||
                            event.resource.color.includes('#fde047') ||
                            event.resource.color.includes('#93c5fd')

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
  const isEnCamino = event.resource.color === '#eab308'

  return (
    <div
      className="h-full w-full p-1.5 overflow-hidden rounded"
      style={{
        background: isEntregado
          ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
          : isEnCamino
          ? 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
          : `linear-gradient(135deg, ${event.resource.color} 0%, ${adjustColor(event.resource.color, -20)} 100%)`,
        color: isLightBackground ? '#1f2937' : '#ffffff',
        fontWeight: '600',
        border: `1px solid ${adjustColor(event.resource.color, -30)}`,
        boxShadow: isEntregado
          ? '0 4px 12px rgba(34, 197, 94, 0.35)'
          : isEnCamino
          ? '0 4px 12px rgba(234, 179, 8, 0.35)'
          : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      <div className="font-bold truncate text-[12px] leading-tight mb-0.5 flex items-center gap-1">
        <span className="text-white/90">{event.resource.vehiculo_nombre}</span>
        {isEntregado && <span className="text-[10px] ml-auto">✓</span>}
        {isEnCamino && <span className="text-[10px] ml-auto">🚚</span>}
      </div>
      <div className="truncate text-[11px] leading-tight mb-0.5 text-white/95">
        {event.resource.cliente_nombre}
      </div>
      {event.resource.venta_nro && (
        <div className="text-[10px] leading-tight truncate mb-0.5 text-white/80 font-medium">
          🧾 {event.resource.venta_nro}
        </div>
      )}
      <div className="text-[10px] leading-tight truncate text-white/85 flex items-center gap-1">
        <span>📦</span>
        <span>{event.resource.productos_count} prod.</span>
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
