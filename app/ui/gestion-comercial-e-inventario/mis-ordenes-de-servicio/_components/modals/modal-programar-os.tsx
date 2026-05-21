'use client'

import { Modal, Alert, Spin } from 'antd'
import { useState, useEffect, Suspense, lazy } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { FaCalendar, FaExclamationTriangle, FaCheck, FaTruck } from 'react-icons/fa'
import { RequerimientoInterno } from '~/lib/api/requerimiento-interno'
import { apiRequest } from '~/lib/api'
import ButtonBase from '~/components/buttons/button-base'

dayjs.locale('es')

const CalendarProgramacionEntregas = lazy(
  () => import('~/app/_components/calendar/calendar-programacion-entregas')
)

interface SlotSeleccionado {
  start: Date
  end: Date
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

interface ModalProgramarOSProps {
  open: boolean
  onClose: () => void
  onAplicar: (fechaInicio: string) => void
  requerimiento: RequerimientoInterno | null
}

export function ModalProgramarOS({
  open,
  onClose,
  onAplicar,
  requerimiento,
}: ModalProgramarOSProps) {
  const [slotPendiente, setSlotPendiente] = useState<SlotSeleccionado | null>(null)
  const [vehiculoNoDisponible, setVehiculoNoDisponible] = useState(false)
  const [razonNoDisponible, setRazonNoDisponible] = useState('')
  const [mantenimientoDetalle, setMantenimientoDetalle] = useState<MantenimientoDetalle | null>(null)
  const [calendarioDesbloqueado, setCalendarioDesbloqueado] = useState(false)

  const vehiculoId = requerimiento?.vehiculo_id
  const tieneVehiculo = !!vehiculoId

  // Desbloquear calendario cuando el modal se abre
  useEffect(() => {
    if (open && tieneVehiculo) {
      setCalendarioDesbloqueado(false)
      setSlotPendiente(null)
    }
  }, [open, tieneVehiculo])

  // Re-bloquear calendario cuando se detecta mantenimiento
  useEffect(() => {
    if (vehiculoNoDisponible && mantenimientoDetalle) {
      setCalendarioDesbloqueado(false)
    }
  }, [vehiculoNoDisponible, mantenimientoDetalle])

  // Verificar disponibilidad del vehículo cuando se selecciona un slot
  useEffect(() => {
    if (!slotPendiente || !vehiculoId) {
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
        }>(`/vehiculos/${vehiculoId}/disponibilidad?fecha=${fecha}`)

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
  }, [slotPendiente, vehiculoId])

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    const slot = { start: slotInfo.start, end: slotInfo.end }
    setSlotPendiente(slot)
  }

  const handleAplicar = () => {
    if (!slotPendiente) return
    const fechaInicio = dayjs(slotPendiente.start).format('YYYY-MM-DD HH:mm:ss')
    onAplicar(fechaInicio)
    handleCancel()
  }

  const handleCancel = () => {
    setSlotPendiente(null)
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
            <span className="font-bold text-slate-700">Programar Orden de Servicio</span>
          </div>
          {requerimiento && (
            <div className="text-xs text-slate-500 ml-6">
              <span className="font-semibold text-slate-700">{requerimiento.codigo}</span>
              <span className="mx-2">•</span>
              <span>{requerimiento.titulo}</span>
            </div>
          )}
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
      styles={{ body: { padding: '16px', height: '750px', overflow: 'auto' } }}
    >
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Spin size="large" />
          </div>
        }
      >
        <div className="relative h-full">
          {/* Alerta de No Disponible */}
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
              {/* Información del Vehículo */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaTruck size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wider font-semibold text-blue-600 mb-1">
                      Vehículo Asignado
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {requerimiento?.vehiculo?.name || `Vehículo ID: ${requerimiento?.vehiculo_id}`}
                    </div>
                    {requerimiento?.vehiculo?.placa && (
                      <div className="text-xs text-slate-600 mt-1">
                        <span>Placa: </span>
                        <span className="font-semibold">{requerimiento.vehiculo.placa}</span>
                      </div>
                    )}
                    {requerimiento?.vehiculo?.tipo && (
                      <div className="text-xs text-slate-600">
                        <span>Tipo: </span>
                        <span className="font-semibold">{requerimiento.vehiculo.tipo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información de Mantenimiento Actual */}
              {mantenimientoDetalle && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaExclamationTriangle size={14} className="text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase tracking-wider font-semibold text-orange-600 mb-1">
                        Fuera de Servicio
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {mantenimientoDetalle.tipo || 'Mantenimiento'}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        <span>Desde: </span>
                        <span className="font-semibold">
                          {dayjs(mantenimientoDetalle.fecha_inicio, 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY')}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600">
                        <span>Hasta: </span>
                        <span className="font-semibold">
                          {dayjs(mantenimientoDetalle.fecha_fin, 'DD/MM/YYYY HH:mm').format('DD/MM/YYYY')}
                        </span>
                      </div>
                      {mantenimientoDetalle.descripcion && (
                        <div className="text-xs text-slate-600 mt-2 italic">
                          {mantenimientoDetalle.descripcion}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de información */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">📅 Selecciona una fecha disponible</p>
                  <p>Arrastra en el calendario para seleccionar horario. El sistema verificará automáticamente la disponibilidad del vehículo.</p>
                </div>
              </div>

              {/* Separador visual */}
              <div className="border-t border-slate-200 my-2"></div>

              {/* Calendario - Bloqueado inicialmente o si hay mantenimiento */}
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wider">Calendario de Disponibilidad</p>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white relative h-[650px]">
                  {calendarioDesbloqueado && (
                    <CalendarProgramacionEntregas
                      onSelectSlot={handleSelectSlot}
                      onSelectEvent={() => {}}
                      onClearSlot={() => setSlotPendiente(null)}
                      onSlotOpen={() => {}}
                      vehiculo_id={vehiculoId}
                      soloSeleccion
                    />
                  )}
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
                            : `Selecciona primero un vehículo para ver sus entregas programadas.`
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
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
