'use client'

import { Modal } from 'antd'
import { useState } from 'react'
import TitleForm from '~/components/form/title-form'
import CalendarProgramacionEntregas from '~/app/_components/calendar/calendar-programacion-entregas'
import { EntregaEvent } from '~/app/_components/calendar/event-entrega'
import ButtonBase from '~/components/buttons/button-base'

interface ModalCalendarioEntregasProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function ModalCalendarioEntregas({
  open,
  setOpen,
}: ModalCalendarioEntregasProps) {
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EntregaEvent | null>(null)

  const handleSelectEvent = (event: EntregaEvent) => {
    // Ignorar el evento temporal de selección
    if (event.id === -1) return
    
    setEventoSeleccionado(event)
  }

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          📅 CALENDARIO DE ENTREGAS PROGRAMADAS
          <div className="text-sm font-normal text-gray-600 mt-1">
            Vista general de todas las entregas
          </div>
        </TitleForm>
      }
      open={open}
      onCancel={() => {
        setOpen(false)
        setEventoSeleccionado(null)
      }}
      width={1400}
      centered
      style={{ top: 20 }}
      footer={
        <div className="flex justify-end gap-2">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => {
              setOpen(false)
              setEventoSeleccionado(null)
            }}
          >
            Cerrar
          </ButtonBase>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Leyenda de colores */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
          <div className="text-sm font-bold text-gray-800">📊 Leyenda:</div>
          
          {/* Estados */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span className="text-xs font-semibold text-gray-700">✅ Entregado</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: '#eab308' }}></div>
            <span className="text-xs font-semibold text-gray-700">🚚 En Camino</span>
          </div>
          
          {/* Separador */}
          <div className="h-6 w-px bg-gray-300"></div>
          
          {/* Choferes */}
          <div className="text-xs font-medium text-gray-600">Choferes:</div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: '#86efac' }}></div>
            <span className="text-xs font-semibold text-gray-700">Chofer 1</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: '#fde047' }}></div>
            <span className="text-xs font-semibold text-gray-700">Chofer 2</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm">
            <div className="w-5 h-5 rounded" style={{ backgroundColor: '#93c5fd' }}></div>
            <span className="text-xs font-semibold text-gray-700">Chofer 3</span>
          </div>
        </div>

        {/* Calendario */}
        <div style={{ height: '600px' }}>
          <CalendarProgramacionEntregas
            onSelectEvent={handleSelectEvent}
            onSelectSlot={() => {}} // No hacer nada al seleccionar slot
          />
        </div>

        {/* Detalles del evento seleccionado */}
        {eventoSeleccionado && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-semibold text-blue-900 mb-2">
              📦 Detalles de la Entrega
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Chofer:</span>{' '}
                <span className="text-gray-900">{eventoSeleccionado.resource.chofer_nombre}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Cliente:</span>{' '}
                <span className="text-gray-900">{eventoSeleccionado.resource.cliente_nombre}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Productos:</span>{' '}
                <span className="text-gray-900">{eventoSeleccionado.resource.productos_count}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Dirección:</span>{' '}
                <span className="text-gray-900">{eventoSeleccionado.resource.direccion || 'No especificada'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
