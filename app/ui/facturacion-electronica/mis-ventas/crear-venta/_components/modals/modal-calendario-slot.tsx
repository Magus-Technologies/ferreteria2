'use client'

import { Modal, Alert } from 'antd'
import { useState, Suspense, lazy, useEffect } from 'react'
import { Spin } from 'antd'
import ButtonBase from '~/components/buttons/button-base'
import { FaCalendar, FaCheck, FaBox, FaCalendarAlt, FaTruck, FaUser, FaMapMarkerAlt, FaExclamationTriangle } from 'react-icons/fa'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import type { EntregaEvent } from '~/app/_components/calendar/event-entrega'
import { apiRequest } from '~/lib/api'

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

interface MantenimientoDetalle {
  id: number
  tipo: string
  descripcion: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  requerimiento?: {
    id: number
    codigo: string
    titulo: string
    observaciones: string
    prioridad: string
  } | null
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
  const [productosExpandidos, setProductosExpandidos] = useState(false)
  const [vehiculoNoDisponible, setVehiculoNoDisponible] = useState(false)
  const [razonNoDisponible, setRazonNoDisponible] = useState('')
  const [mantenimientoDetalle, setMantenimientoDetalle] = useState<MantenimientoDetalle | null>(null)
  const [calendarioDesbloqueado, setCalendarioDesbloqueado] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date())
  const tieneVehiculo = !!vehiculo_id

  // Desbloquear calendario cuando el modal se abre
  useEffect(() => {
    if (open && tieneVehiculo) {
      setCalendarioDesbloqueado(false)
      setSlotPendiente(null)
      setMantenimientoDetalle(null)
      setVehiculoNoDisponible(false)
      setRazonNoDisponible('')
      setSelectedCalendarDate(new Date())
    }
  }, [open, tieneVehiculo])

  // Verificar si el vehículo ya está en mantenimiento al abrir el modal
  useEffect(() => {
    if (!open || !tieneVehiculo || slotPendiente) {
      return
    }

    const verificarMantenimientoInicial = async () => {
      try {
        const fecha = dayjs().format('YYYY-MM-DD')
        const response = await apiRequest<{ disponible: boolean; razon?: string; mantenimiento?: MantenimientoDetalle }>(
          `/vehiculos/${vehiculo_id}/disponibilidad?fecha=${fecha}`
        )

        if (!response.data?.disponible) {
          setVehiculoNoDisponible(true)
          setRazonNoDisponible(response.data?.razon || 'El vehículo no está disponible en esta fecha')
          if (response.data?.mantenimiento) {
            setMantenimientoDetalle(response.data.mantenimiento)
          }
        } else {
          setVehiculoNoDisponible(false)
          setRazonNoDisponible('')
          setMantenimientoDetalle(null)
        }
      } catch (error) {
        console.error('Error verificando disponibilidad inicial:', error)
      }
    }

    verificarMantenimientoInicial()
  }, [open, tieneVehiculo, vehiculo_id, slotPendiente])

  // Re-bloquear calendario cuando se detecta mantenimiento
  useEffect(() => {
    if (vehiculoNoDisponible && mantenimientoDetalle) {
      setCalendarioDesbloqueado(false)
      const siguienteDia = dayjs(mantenimientoDetalle.fecha_fin, 'DD/MM/YYYY HH:mm')
        .add(1, 'day')
        .startOf('day')
        .toDate()
      setSelectedCalendarDate(siguienteDia)
      setSlotPendiente(null)
    }
  }, [vehiculoNoDisponible, mantenimientoDetalle])

  // Verificar disponibilidad del vehículo cuando se selecciona un slot
  useEffect(() => {
    if (!slotPendiente || !vehiculo_id) {
      setVehiculoNoDisponible(false)
      setRazonNoDisponible('')
      setMantenimientoDetalle(null)
      return
    }

    const verificarDisponibilidad = async () => {
      try {
        const fecha = dayjs(slotPendiente.start).format('YYYY-MM-DD')
        const response = await apiRequest<{
          disponible: boolean
          razon?: string
          mantenimiento?: MantenimientoDetalle
        }>(`/vehiculos/${vehiculo_id}/disponibilidad?fecha=${fecha}`)

        if (!response.data?.disponible) {
          setVehiculoNoDisponible(true)
          setRazonNoDisponible(response.data?.razon || 'El vehículo no está disponible en esta fecha')
          if (response.data?.mantenimiento) {
            setMantenimientoDetalle(response.data.mantenimiento)
          }
        } else {
          setVehiculoNoDisponible(false)
          setRazonNoDisponible('')
          setMantenimientoDetalle(null)
        }
      } catch (error) {
        console.error('Error verificando disponibilidad:', error)
        setVehiculoNoDisponible(false)
        setMantenimientoDetalle(null)
      }
    }

    verificarDisponibilidad()
  }, [slotPendiente, vehiculo_id])

  // onSelectSlot se dispara desde el popup del calendario
  // → Solo establecemos el slot, NO aplicamos aún
  // El usuario debe hacer clic en "Aplicar" después de ver el popup de mantenimiento
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const slot = { start: slotInfo.start, end: slotInfo.end }
    setSlotPendiente(slot)
    // NO llamar a onAplicar() aquí - dejar que el useEffect verifique disponibilidad primero
  }

  const handleAplicar = () => {
    if (!slotPendiente) return
    onAplicar(slotPendiente)
    onClose()
  }

  const handleCancel = () => {
    setSlotPendiente(null)
    setEventoSeleccionado(null)
    setProductosExpandidos(false)
    setMantenimientoDetalle(null)
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
              disabled={!slotPendiente || vehiculoNoDisponible}
            >
              Aplicar
            </ButtonBase>
          </div>
        </div>
      }
      styles={{ body: { padding: '16px', height: '560px', overflow: 'auto' } }}
      >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
          </div>
        }
      >
        <div className="relative h-full">
          {vehiculoNoDisponible && (
            <div className="mb-3 z-50">
              <Alert
                message="⚠️ Vehículo no disponible"
                description={razonNoDisponible || 'El vehículo está fuera de servicio en esta fecha'}
                type="warning"
                showIcon
                icon={<FaExclamationTriangle />}
                closable
              />
            </div>
          )}
          {tieneVehiculo ? (
            <>
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white relative h-96">
                <CalendarProgramacionEntregas
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={setEventoSeleccionado}
                  onClearSlot={() => setSlotPendiente(null)}
                  onSlotOpen={() => setEventoSeleccionado(null)}
                  selectedDate={selectedCalendarDate}
                  disabledRanges={
                    mantenimientoDetalle
                      ? [
                          {
                            start: dayjs(mantenimientoDetalle.fecha_inicio, 'DD/MM/YYYY HH:mm').toDate(),
                            end: dayjs(mantenimientoDetalle.fecha_fin, 'DD/MM/YYYY HH:mm').toDate(),
                          },
                        ]
                      : []
                  }
                  vehiculo_id={vehiculo_id}
                  soloSeleccion
                />
                {!calendarioDesbloqueado && (
                  <div
                    onClick={() => setCalendarioDesbloqueado(true)}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-lg cursor-pointer"
                  >
                    <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 text-center">
                      {mantenimientoDetalle
                        ? `El vehículo está fuera de servicio. Haz clic para seleccionar una fecha alternativa.`
                        : tieneVehiculo
                          ? `Haz clic para desbloquear el calendario y ver las entregas programadas.`
                          : `Selecciona primero un vehículo para ver sus entregas programadas.`}
                    </div>
                  </div>
                )}
              </div>
              {/* Popup de Mantenimiento - Interactivo como Entrega Programada */}
              {/*
              Este modal de mantenimiento se ha deshabilitado porque se muestra el alerta
              de vehículo no disponible y se bloquea el calendario.
              {mantenimientoDetalle && (
                ...contenido original comentado...
              )}
              */}
              {/* Popup de Entrega Programada */}
              {eventoSeleccionado && (
                <div className="absolute top-4 right-4 z-[1000] w-[290px] max-w-[calc(100%-2rem)] rounded-2xl border border-slate-200/60 bg-white shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)] overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 px-4 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                          <FaTruck size={14} className="text-white" />
                        </div>
                        <div>
                          <div className="text-emerald-100 text-[10px] uppercase tracking-wider font-semibold">Entrega Programada</div>
                          <div className="font-bold text-sm text-white truncate leading-tight">
                            {eventoSeleccionado.resource.vehiculo_nombre || 'Sin unidad'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEventoSeleccionado(null)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-all text-lg leading-none flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3.5 text-sm bg-gradient-to-b from-slate-50 to-white">
                    <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaCalendarAlt size={10} className="text-amber-600" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Horario</span>
                      </div>
                      <div className="text-slate-800 font-semibold text-sm capitalize pl-7 leading-tight">
                        {dayjs(eventoSeleccionado.start).format('dddd D [de] MMMM')}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 pl-7">
                        <div className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-lg">
                          <span className="text-blue-700 font-bold text-xs">{dayjs(eventoSeleccionado.start).format('HH:mm')}</span>
                        </div>
                        <span className="text-slate-400 text-xs">—</span>
                        <div className="px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-lg">
                          <span className="text-blue-700 font-bold text-xs">{dayjs(eventoSeleccionado.end).format('HH:mm')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FaUser size={10} className="text-indigo-600" />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Cliente</span>
                      </div>
                      <div className="text-slate-800 font-semibold text-sm pl-7 leading-tight">
                        {eventoSeleccionado.resource.cliente_nombre || 'Sin cliente'}
                      </div>
                      {eventoSeleccionado.resource.venta_nro && (
                        <div className="text-xs text-teal-600 font-medium mt-1 pl-7">
                          🧾 {eventoSeleccionado.resource.venta_nro}
                        </div>
                      )}
                    </div>

                    {/* Productos expandibles */}
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setProductosExpandidos(!productosExpandidos)}
                        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaBox size={10} className="text-amber-600" />
                          </div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Productos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            {productosExpandidos ? '' : `${eventoSeleccionado.resource.productos_count} producto(s)`}
                          </span>
                          <span className={`text-slate-400 transition-transform ${productosExpandidos ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </button>

                      {productosExpandidos && (
                        <div className="px-3 pb-3 space-y-2 border-t border-slate-50">
                          {eventoSeleccionado.resource.productos_detallado && eventoSeleccionado.resource.productos_detallado.length > 0 ? (
                            eventoSeleccionado.resource.productos_detallado.map((producto: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 pt-2">
                                <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-emerald-600 text-[10px]">✓</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-slate-700 truncate">
                                    {producto.producto}
                                  </div>
                                  {producto.codigo && (
                                    <div className="text-[10px] text-slate-500">
                                      {producto.codigo}
                                    </div>
                                  )}
                                  <div className="text-[10px] text-slate-600 mt-0.5">
                                    <span className="font-semibold">{producto.cantidad}</span> {producto.unidad || 'und'}
                                    {producto.marca && <span className="text-slate-400 ml-1">• {producto.marca}</span>}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 pt-2 text-center">
                              {eventoSeleccionado.resource.productos_count} producto(s) en esta entrega
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {eventoSeleccionado.resource.direccion && (
                      <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-5 h-5 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FaMapMarkerAlt size={10} className="text-rose-600" />
                          </div>
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Dirección</span>
                        </div>
                        <div className="text-slate-700 font-medium text-sm pl-7 leading-tight">
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
