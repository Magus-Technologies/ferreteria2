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
    cliente_nombre: string
    direccion: string
    productos_count: number
    color: string
  }
}

interface EventEntregaProps {
  event: EntregaEvent
}

export default function EventEntrega({ event }: EventEntregaProps) {
  // Determinar si el fondo es claro u oscuro para ajustar el color del texto
  const isLightBackground = event.resource.color.includes('#86efac') || 
                            event.resource.color.includes('#fde047') ||
                            event.resource.color.includes('#93c5fd')
  
  return (
    <div
      className="h-full w-full p-1.5 overflow-hidden rounded"
      style={{
        backgroundColor: event.resource.color,
        color: isLightBackground ? '#1f2937' : '#ffffff',
        fontWeight: '600',
        border: `1px solid ${event.resource.color}`,
        filter: 'brightness(0.95)',
      }}
    >
      <div className="font-bold truncate text-[12px] leading-tight mb-0.5" style={{ textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>
        {event.resource.chofer_nombre}
      </div>
      <div className="truncate text-[11px] leading-tight mb-0.5" style={{ textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>
        {event.resource.cliente_nombre}
      </div>
      <div className="text-[10px] leading-tight truncate" style={{ opacity: 0.9, textShadow: '0 0 1px rgba(255,255,255,0.3)' }}>
        📦 {event.resource.productos_count} producto(s)
      </div>
    </div>
  )
}
