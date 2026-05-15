'use client'

import { Modal } from 'antd'
import { useState, useMemo } from 'react'
import TitleForm from '~/components/form/title-form'
import CalendarProgramacionEntregas from '~/app/_components/calendar/calendar-programacion-entregas'
import { EntregaEvent } from '~/app/_components/calendar/event-entrega'
import ButtonBase from '~/components/buttons/button-base'
import { useEntregasProgramadas } from '~/hooks/use-entregas-programadas'
import dayjs from 'dayjs'
import { FaTruck } from 'react-icons/fa'

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
    solo_programadas: false,
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
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-xl border border-slate-200/60 shadow-sm">
          <div className="text-sm font-bold text-slate-700">📊 Leyenda:</div>

          {/* Estados */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
            <div className="w-5 h-5 rounded shadow-inner" style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' }}></div>
            <span className="text-xs font-semibold text-slate-700">✅ Entregado</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
            <div className="w-5 h-5 rounded shadow-inner" style={{ background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }}></div>
            <span className="text-xs font-semibold text-slate-700">🚚 En Camino</span>
          </div>

          {/* Separador */}
          {despachadores.length > 0 && <div className="h-6 w-px bg-slate-300"></div>}

          {/* Despachadores dinámicos */}
          {despachadores.length > 0 && (
            <>
              <div className="text-xs font-medium text-slate-600">Despachadores:</div>
              {despachadores.map((despachador) => (
                <div key={despachador.id} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                  <div className="w-5 h-5 rounded shadow-inner" style={{ background: `linear-gradient(135deg, ${despachador.color} 0%, ${adjustColor(despachador.color, -20)} 100%)` }}></div>
                  <span className="text-xs font-semibold text-slate-700">{despachador.nombre}</span>
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
            soloProgramadasActivas={false}
          />
        </div>

        {/* Detalles del evento seleccionado */}
        {eventoSeleccionado && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 border border-slate-200/80 shadow-lg">
            {/* Header decorativo */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                    <FaTruck size={15} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm leading-tight">Detalles de la Entrega</div>
                    <div className="text-emerald-100 text-xs font-medium mt-0.5">
                      {eventoSeleccionado.resource.vehiculo_nombre}
                    </div>
                  </div>
                </div>
                {eventoSeleccionado.resource.venta_nro && (
                  <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg">
                    <span className="text-white font-bold text-sm">{eventoSeleccionado.resource.venta_nro}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cuerpo con información */}
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 text-xs">👤</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</span>
                  </div>
                  <div className="text-slate-800 font-semibold text-sm pl-8 leading-tight">
                    {eventoSeleccionado.resource.cliente_nombre}
                  </div>
                </div>

                {/* Productos */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 text-xs">📦</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Productos</span>
                  </div>
                  <div className="text-slate-800 font-bold text-sm pl-8 leading-tight">
                    {eventoSeleccionado.resource.productos_count} producto(s)
                  </div>
                </div>

                {/* Despachador */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-600 text-xs">🚚</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Despachador</span>
                  </div>
                  <div className="text-slate-800 font-semibold text-sm pl-8 leading-tight">
                    {eventoSeleccionado.resource.chofer_nombre}
                  </div>
                </div>

                {/* Dirección */}
                <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-rose-600 text-xs">📍</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dirección</span>
                  </div>
                  <div className="text-slate-800 font-medium text-sm pl-8 leading-tight">
                    {eventoSeleccionado.resource.direccion || 'No especificada'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount))
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
