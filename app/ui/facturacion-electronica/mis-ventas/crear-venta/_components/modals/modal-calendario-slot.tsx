'use client'

import { Modal } from 'antd'
import { useState, Suspense, lazy } from 'react'
import { Spin } from 'antd'
import ButtonBase from '~/components/buttons/button-base'
import { FaCalendar, FaCheck, FaBox, FaCalendarAlt, FaTruck, FaUser, FaMapMarkerAlt } from 'react-icons/fa'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { EntregaEvent } from '~/app/_components/calendar/event-entrega'

dayjs.locale('es')

const CalendarProgramacionEntregas = lazy(
  () => import('~/app/_components/calendar/calendar-programacion-entregas')
)

interface SlotSeleccionado {
  start: Date
  end: Date
}

interface VehiculoVisible {
  id: number
  name: string
  tipo?: string | null
  placa?: string | null
}

interface ModalCalendarioSlotProps {
  open: boolean
  onClose: () => void
  onAplicar: (slot: SlotSeleccionado) => void
  vehiculo_id?: number
  vehiculo?: VehiculoVisible | null
}

export default function ModalCalendarioSlot({
  open,
  onClose,
  onAplicar,
  vehiculo_id,
  vehiculo,
}: ModalCalendarioSlotProps) {
  const [slotPendiente, setSlotPendiente] = useState<SlotSeleccionado | null>(null)
  const [eventoSeleccionado, setEventoSeleccionado] = useState<EntregaEvent | null>(null)
  const tieneVehiculo = !!vehiculo_id

  // onSelectSlot se dispara desde el popup del calendario al dar "Aplicar"
  // → aplicamos directamente y cerramos el modal (1 solo clic)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const slot = { start: slotInfo.start, end: slotInfo.end }
    setSlotPendiente(slot)
    onAplicar(slot)
    onClose()
  }

  const handleAplicar = () => {
    if (!slotPendiente) return
    onAplicar(slotPendiente)
    onClose()
  }

  const handleCancel = () => {
    setSlotPendiente(null)
    setEventoSeleccionado(null)
    onClose()
  }

  const resumenSlot = slotPendiente
    ? `${dayjs(slotPendiente.start).format('dddd D [de] MMMM')}, ${dayjs(slotPendiente.start).format('HH:mm')} — ${dayjs(slotPendiente.end).format('HH:mm')}`
    : null

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      title={
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FaCalendar className="text-amber-500" />
            <span className="font-bold text-slate-700">Elegir fecha y hora de entrega</span>
          </div>
          <div className="text-xs text-slate-500 ml-6">
            Unidad:
            <span className="font-semibold text-slate-700 ml-1">
              {vehiculo
                ? `${vehiculo.name}${vehiculo.placa ? ` (${vehiculo.placa})` : ''}${vehiculo.tipo ? ` - ${vehiculo.tipo}` : ''}`
                : vehiculo_id
                  ? `ID ${vehiculo_id}`
                  : 'Sin unidad asignada'}
            </span>
          </div>
        </div>
      }
      width={900}
      centered
      footer={
        <div className="flex items-center justify-between gap-3">
          {/* Resumen del slot seleccionado */}
          <div className="text-sm text-slate-600 min-h-[20px]">
            {slotPendiente ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <FaCheck size={12} />
                {resumenSlot}
              </span>
            ) : (
              <span className="text-slate-400 italic">
                Arrastra en el calendario para seleccionar un horario
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <ButtonBase color="default" size="md" onClick={handleCancel}>
              Cancelar
            </ButtonBase>
            <ButtonBase
              color="success"
              size="md"
              onClick={handleAplicar}
              disabled={!slotPendiente}
            >
              Aplicar
            </ButtonBase>
          </div>
        </div>
      }
      styles={{ body: { padding: '16px', height: '560px', overflow: 'hidden' } }}
      >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
          </div>
        }
      >
        <div className="relative h-full">
          {tieneVehiculo ? (
            <>
              <CalendarProgramacionEntregas
                onSelectSlot={handleSelectSlot}
                onSelectEvent={setEventoSeleccionado}
                vehiculo_id={vehiculo_id}
                soloSeleccion
              />
              {eventoSeleccionado && (
                <div className="absolute top-4 right-4 z-[1000] w-[290px] max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                  <div
                    className="px-4 py-3 bg-slate-50 border-b border-slate-200 text-slate-800"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-slate-500">Entrega programada</div>
                        <div className="font-bold text-sm truncate">
                          {eventoSeleccionado.resource.vehiculo_nombre || 'Sin unidad'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEventoSeleccionado(null)}
                        className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-semibold">
                        <FaCalendarAlt size={11} />
                        Horario
                      </div>
                      <div className="mt-1 font-medium text-slate-700">
                        {dayjs(eventoSeleccionado.start).format('dddd D [de] MMMM')}
                      </div>
                      <div className="text-slate-500">
                        {dayjs(eventoSeleccionado.start).format('HH:mm')} - {dayjs(eventoSeleccionado.end).format('HH:mm')}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-semibold">
                        <FaUser size={11} />
                        Cliente
                      </div>
                      <div className="mt-1 font-medium text-slate-700">
                        {eventoSeleccionado.resource.cliente_nombre || 'Sin cliente'}
                      </div>
                      {eventoSeleccionado.resource.venta_nro && (
                        <div className="text-xs text-slate-400 mt-1">
                          Venta: {eventoSeleccionado.resource.venta_nro}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-semibold">
                        <FaBox size={11} />
                        Productos
                      </div>
                      <div className="mt-1 font-medium text-slate-700">
                        {eventoSeleccionado.resource.productos_count} producto(s)
                      </div>
                    </div>

                    {eventoSeleccionado.resource.direccion && (
                      <div>
                        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-semibold">
                          <FaMapMarkerAlt size={11} />
                          Dirección
                        </div>
                        <div className="mt-1 text-slate-700">
                          {eventoSeleccionado.resource.direccion}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Selecciona primero un vehículo para ver sus entregas programadas.
              </div>
            </div>
          )}
        </div>
      </Suspense>
    </Modal>
  )
}
