'use client'

import { Modal } from 'antd'
import { useState, useMemo } from 'react'
import TitleForm from '~/components/form/title-form'
import CalendarProgramacionEntregas from '~/app/_components/calendar/calendar-programacion-entregas'
import { EntregaEvent } from '~/app/_components/calendar/event-entrega'
import ButtonBase from '~/components/buttons/button-base'
import { useEntregasProgramadas } from '~/hooks/use-entregas-programadas'
import dayjs from 'dayjs'

interface ModalCalendarioEntregasProps {
  open: boolean
  setOpen: (open: boolean) => void
}

// Colores por despachador (mismo que en el calendario)
const CHOFER_COLORS = [
  '#86efac', // verde claro
  '#fde047', // amarillo
  '#93c5fd', // azul claro
  '#fca5a5', // rojo claro
  '#c4b5fd', // morado claro
  '#fdba74', // naranja claro
]

export default function ModalCalendarioEntregas({
  open,
  setOpen,
}: ModalCalendarioEntregasProps) {
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EntregaEvent | null>(null)

  // Obtener entregas para generar la leyenda de despachadores
  const { data: entregas = [], isLoading, error } = useEntregasProgramadas({
    fecha_desde: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    fecha_hasta: dayjs().add(30, 'days').format('YYYY-MM-DD'),
  })

  // 🔍 DEBUG: Ver qué entregas llegan al modal
  console.log('🔍 MODAL - Entregas recibidas:', entregas)
  console.log('🔍 MODAL - isLoading:', isLoading)
  console.log('🔍 MODAL - error:', error)
  console.log('🔍 MODAL - Rango de fechas:', {
    desde: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    hasta: dayjs().add(30, 'days').format('YYYY-MM-DD'),
  })

  // Generar lista única de despachadores con sus colores
  const despachadores = useMemo(() => {
    const choferMap = new Map<string, { id: string; nombre: string; color: string }>()
    let colorIndex = 0

    entregas.forEach((entrega: any) => {
      if (entrega.chofer_id && !choferMap.has(entrega.chofer_id)) {
        // Solo agregar si la entrega está pendiente (no entregada ni en camino)
        if (entrega.estado_entrega === 'pe') {
          const despachadorNombre = entrega.despachador?.name || entrega.chofer?.name || 'Despachador'
          choferMap.set(entrega.chofer_id, {
            id: entrega.chofer_id,
            nombre: despachadorNombre,
            color: CHOFER_COLORS[colorIndex % CHOFER_COLORS.length],
          })
          colorIndex++
        }
      }
    })

    return Array.from(choferMap.values())
  }, [entregas])

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
          {despachadores.length > 0 && <div className="h-6 w-px bg-gray-300"></div>}
          
          {/* Despachadores dinámicos */}
          {despachadores.length > 0 && (
            <>
              <div className="text-xs font-medium text-gray-600">Despachadores:</div>
              {despachadores.map((despachador) => (
                <div key={despachador.id} className="flex items-center gap-2 px-3 py-1 bg-white rounded-md shadow-sm">
                  <div className="w-5 h-5 rounded" style={{ backgroundColor: despachador.color }}></div>
                  <span className="text-xs font-semibold text-gray-700">{despachador.nombre}</span>
                </div>
              ))}
            </>
          )}
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
                <span className="font-medium text-gray-700">Despachador:</span>{' '}
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
