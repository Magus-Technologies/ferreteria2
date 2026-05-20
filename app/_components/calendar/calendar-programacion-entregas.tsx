'use client'

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-styles.css'
import { useEntregasProgramadas } from '~/hooks/use-entregas-programadas'
import EventEntrega, { EntregaEvent } from './event-entrega'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { formatFechaPeru } from '~/utils/fechas'
import { Select } from 'antd'
import { FaChevronLeft, FaChevronRight, FaCalendarDay, FaTruck } from 'react-icons/fa'

dayjs.locale('es')

// Configurar localizador en español
const locales = { es }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: es }),
  getDay,
  locales,
})

const ESTADO_EVENT_COLORS = {
  pe: '#f59e0b',
  ec: '#3b82f6',
  en: '#22c55e',
  ca: '#ef4444',
} as const

// ─── Toolbar personalizado ────────────────────────────────────────────────────
interface CustomToolbarProps {
  label: string
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void
  onView: (view: View) => void
  view: View
}

function CustomToolbar({ label, onNavigate, onView, view }: CustomToolbarProps) {
  const viewOptions = [
    { value: 'day', label: 'Día' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mes' },
    { value: 'agenda', label: 'Agenda' },
  ]

  return (
    <div className="flex items-center justify-between gap-3 mb-3 px-1">
      {/* Navegación */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Hoy
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <FaChevronLeft size={12} />
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <FaChevronRight size={12} />
        </button>
      </div>

      {/* Título */}
      <span className="text-sm font-semibold text-slate-700 capitalize">
        {label}
      </span>

      {/* Select de vista */}
      <Select
        value={view}
        onChange={(v) => onView(v as View)}
        size="small"
        style={{ width: 110 }}
        options={viewOptions}
        suffixIcon={<FaCalendarDay size={11} className="text-slate-400" />}
      />
    </div>
  )
}

// ─── Popup de slot seleccionado (estilo Google Calendar) ──────────────────────
interface SlotPopupProps {
  slot: { start: Date; end: Date }
  position: { top: number; left: number }
  onAplicar: () => void
  onCerrar: () => void
  /** true = modo solo selección (modal de entrega): muestra "Aplicar" */
  soloSeleccion: boolean
}

function SlotPopup({ slot, position, onAplicar, onCerrar, soloSeleccion }: SlotPopupProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    if (rect.right > vw - 8) {
      ref.current.style.left = `${vw - rect.width - 16}px`
    }
    if (rect.bottom > vh - 8) {
      ref.current.style.top = `${vh - rect.height - 16}px`
    }
  }, [position])

  const fechaFormato = dayjs(slot.start).format('dddd D [de] MMMM')
  const horaInicio = dayjs(slot.start).format('HH:mm')
  const horaFin = dayjs(slot.end).format('HH:mm')

  return (
    <div
      ref={ref}
      className="fixed z-[9999] bg-white rounded-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.25)] border border-slate-200/60 w-[300px] overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-4 py-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
            <FaTruck size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-tight">
              Entrega Programada
            </div>
            <div className="text-emerald-100 text-xs mt-0.5 font-medium">
              Programar horario de entrega
            </div>
          </div>
        </div>
        <button
          onClick={onCerrar}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-all text-lg leading-none flex-shrink-0"
        >
          ×
        </button>
      </div>

      <div className="bg-gradient-to-b from-slate-50 to-white px-5 py-4 space-y-3">
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-amber-600 text-xs">📅</span>
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha y Horario</span>
          </div>
          <div className="text-slate-800 font-bold text-base capitalize pl-8">
            {fechaFormato}
          </div>
          <div className="flex items-center gap-2 mt-2 pl-8">
            <div className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="text-blue-700 font-bold text-sm">{horaInicio}</span>
            </div>
            <span className="text-slate-400 text-xs">—</span>
            <div className="px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-lg">
              <span className="text-blue-700 font-bold text-sm">{horaFin}</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          Arrastra para ajustar el horario, luego haz clic en{' '}
          <span className="font-semibold text-emerald-600">
            {soloSeleccion ? 'Aplicar' : 'confirmar'}
          </span>
          .
        </p>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex justify-end gap-2">
        <button
          onClick={onCerrar}
          className="text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-4 py-1.5 rounded-lg transition-all font-medium"
        >
          Cancelar
        </button>
        {soloSeleccion && (
          <button
            onClick={onAplicar}
            className="text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-1.5 rounded-lg hover:from-emerald-600 hover:to-teal-700 font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Aplicar</span>
            <span className="text-xs">✓</span>
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Props del componente principal ──────────────────────────────────────────
interface CalendarProgramacionEntregasProps {
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
  onSelectEvent?: (event: EntregaEvent) => void
  /** Callback para cerrar popup de slot cuando se selecciona un evento */
  onClearSlot?: () => void
  /** Callback cuando se abre el popup de slot (para limpiar evento seleccionado) */
  onSlotOpen?: () => void
  selectedDate?: Date
  chofer_id?: string
  vehiculo_id?: number
  /** Si es true, no carga entregas del backend (solo selección de slot) */
  soloSeleccion?: boolean
  /** true: oculta entregadas/canceladas. false: muestra histórico programado también. */
  soloProgramadasActivas?: boolean
}

export default function CalendarProgramacionEntregas({
  onSelectSlot,
  onSelectEvent,
  onClearSlot,
  onSlotOpen,
  selectedDate,
  chofer_id,
  vehiculo_id,
  soloSeleccion = false,
  soloProgramadasActivas = true,
}: CalendarProgramacionEntregasProps) {
  const [view, setView] = useState<View>('day')
  const [date, setDate] = useState(selectedDate || new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [popupPos, setPopupPos] = useState<{ top: number; left: number } | null>(null)

  // Calcular rango de fechas para la consulta
  const { fecha_desde, fecha_hasta } = useMemo(() => {
    const desde = dayjs(date).subtract(7, 'days').format('YYYY-MM-DD')
    const hasta = dayjs(date).add(7, 'days').format('YYYY-MM-DD')
    return { fecha_desde: desde, fecha_hasta: hasta }
  }, [date])

  // Obtener entregas programadas (en modo soloSeleccion, solo si hay chofer_id)
  const { data: entregas = [], isLoading } = useEntregasProgramadas({
    fecha_desde,
    fecha_hasta,
    chofer_id,
    vehiculo_id,
    solo_programadas: soloProgramadasActivas,
    enabled: true,
  })

  // Transformar entregas a eventos del calendario
  const events: EntregaEvent[] = useMemo(() => {
    const entregasEvents = entregas
      // Defensa extra: filtrar cualquier entrega sin fecha_programada o sin hora_inicio/fin
      // (el backend con solo_programadas=true ya filtra, pero evita duplicados si se reusa).
      .filter((e: any) => e.fecha_programada && e.hora_inicio && e.hora_fin)
      .map((entrega: any) => {
      const color =
        ESTADO_EVENT_COLORS[
          (entrega.estado_entrega as keyof typeof ESTADO_EVENT_COLORS) || 'pe'
        ] || ESTADO_EVENT_COLORS.pe

      // fecha_programada viene como ISO UTC (Laravel cast datetime). Convertir a Lima
      // antes de tomar YYYY-MM-DD para evitar corrimientos de día por tz del navegador.
      const fechaSoloFecha = formatFechaPeru(entrega.fecha_programada, 'YYYY-MM-DD')
      const horaInicio = entrega.hora_inicio
      const horaFin = entrega.hora_fin
      const start = dayjs(`${fechaSoloFecha} ${horaInicio}`, 'YYYY-MM-DD HH:mm').toDate()
      const end = dayjs(`${fechaSoloFecha} ${horaFin}`, 'YYYY-MM-DD HH:mm').toDate()

      const clienteNombre = entrega.venta?.cliente?.razon_social ||
        `${entrega.venta?.cliente?.nombres || ''} ${entrega.venta?.cliente?.apellidos || ''}`.trim() ||
        'Cliente'
      const despachadorNombre = entrega.despachador?.name || 'Sin asignar'
      const vehiculoNombre = entrega.vehiculo
        ? `${entrega.vehiculo.name}${entrega.vehiculo.placa ? ` (${entrega.vehiculo.placa})` : ''}`
        : 'Sin unidad'

      // Armar número de venta con tipo de documento
      const tipoDoc = entrega.venta?.tipo_documento
      const tipoLabel = tipoDoc === '01' ? 'F' : tipoDoc === '03' ? 'B' : tipoDoc === 'nv' ? 'NV' : ''
      const ventaNro = entrega.venta?.serie && entrega.venta?.numero
        ? `${tipoLabel ? tipoLabel + ' ' : ''}${entrega.venta.serie}-${entrega.venta.numero}`
        : ''

      // Productos detallados
      const productosDetallado = (entrega.productos_entregados || []).map((detalle: any) => {
        const udv = detalle.unidad_derivada_venta || {}
        const pav = udv.producto_almacen_venta || {}
        const pa = pav.producto_almacen || {}
        const producto = pa.producto || {}
        return {
          producto: producto.name || '',
          codigo: producto.cod_producto || '',
          cantidad: Number(udv.cantidad || detalle.cantidad_entregada || 0),
          unidad: udv.unidad_derivada_inmutable?.name || '',
          marca: producto.marca?.name || '',
        }
      })

      return {
        id: entrega.id,
        title: `${vehiculoNombre} - ${clienteNombre}`,
        start,
        end,
        resource: {
          venta_id: entrega.venta_id,
          chofer_id: entrega.chofer_id,
          chofer_nombre: despachadorNombre,
          vehiculo_id: entrega.vehiculo_id,
          vehiculo_nombre: vehiculoNombre,
          cliente_nombre: clienteNombre,
          direccion: entrega.direccion_entrega || '',
          productos_count: entrega.productos_entregados?.length || 0,
          productos_detallado: productosDetallado,
          color,
          venta_nro: ventaNro,
        },
      }
    })

    // Evento temporal de selección actual
    if (selectedSlot) {
      entregasEvents.push({
        id: -1,
        title: '📅 Entrega a programar',
        start: selectedSlot.start,
        end: selectedSlot.end,
        resource: {
          venta_id: '',
          chofer_id: '',
          chofer_nombre: '',
          vehiculo_id: undefined,
          vehiculo_nombre: '',
          cliente_nombre: '',
          direccion: '',
          productos_count: 0,
          productos_detallado: [],
          color: '#3b82f6',
          venta_nro: '',
        },
      })
    }

    return entregasEvents
  }, [entregas, selectedSlot])

  // Formatos de fecha en español
  const formats = {
    dateFormat: 'dd',
    dayFormat: (date: Date) => format(date, 'EEEE', { locale: es }),
    dayHeaderFormat: (date: Date) => format(date, 'EEEE d', { locale: es }),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`,
    monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: es }),
    weekdayFormat: (date: Date) => format(date, 'EEEE', { locale: es }),
    timeGutterFormat: (date: Date) => format(date, 'h aa', { locale: es }),
  }

  // Mensajes en español
  const messages = {
    allDay: 'Todo el día',
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay entregas programadas en este rango',
    showMore: (total: number) => `+ Ver más (${total})`,
  }

  // Horario de trabajo (7 AM - 7 PM)
  const minTime = useMemo(() => new Date(1970, 1, 1, 7, 0, 0), [])
  const maxTime = useMemo(() => new Date(1970, 1, 1, 19, 0, 0), [])

  // Selección de slot — guarda posición para el popup
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; action: string; bounds?: any; box?: any }) => {
      if (slotInfo.action !== 'select' && slotInfo.action !== 'click') return

      // En modo vista (no soloSeleccion), solo notificar al padre sin popup
      if (!soloSeleccion) {
        onSelectSlot?.({ start: slotInfo.start, end: slotInfo.end })
        return
      }

      setSelectedSlot({ start: slotInfo.start, end: slotInfo.end })

      // Calcular posición del popup
      let top = 200
      let left = 200
      if (slotInfo.bounds) {
        top = slotInfo.bounds.top + window.scrollY + 10
        left = slotInfo.bounds.right + 12
      } else if (slotInfo.box) {
        top = slotInfo.box.clientY + window.scrollY - 40
        left = slotInfo.box.clientX + 12
      }
      setPopupPos({ top, left })

      // Notificar al padre que se abrió el popup de slot (limpiar evento seleccionado)
      onSlotOpen?.()
    },
    [soloSeleccion, onSelectSlot, onSlotOpen]
  )

  const handleAplicarSlot = useCallback(() => {
    if (selectedSlot) {
      onSelectSlot?.(selectedSlot)
    }
    setPopupPos(null)
  }, [selectedSlot, onSelectSlot])

  const handleCerrarPopup = useCallback(() => {
    setSelectedSlot(null)
    setPopupPos(null)
  }, [])

  // Clic en evento
  const handleSelectEvent = useCallback(
    (event: EntregaEvent) => {
      if (event.id === -1) return
      setSelectedEventId(event.id)
      // Cerrar popup de slot si está abierto (cuando se selecciona un evento)
      if (popupPos) {
        setSelectedSlot(null)
        setPopupPos(null)
        onClearSlot?.()
      }
      onSelectEvent?.(event)
    },
    [onSelectEvent, popupPos, onClearSlot]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-lg">
        <div className="text-gray-500">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white rounded-lg">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        messages={messages}
        formats={formats}
        culture="es"
        selectable={soloSeleccion}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        step={30}
        timeslots={2}
        min={minTime}
        max={maxTime}
        components={{
          event: EventEntrega,
          toolbar: CustomToolbar as any,
        }}
        eventPropGetter={(event: EntregaEvent) => ({
          style: {
            backgroundColor: event.resource.color,
            borderColor: event.resource.color,
            color: '#000',
            border: event.id === -1 ? '2px dashed #3b82f6' : '1px solid rgba(0,0,0,0.1)',
            opacity: event.id === -1 ? 0.85 : 1,
            fontWeight: '600',
            boxShadow: event.id === selectedEventId ? '0 0 0 3px rgba(59,130,246,0.5)' : undefined,
          },
        })}
      />

      {/* Popup estilo Google Calendar */}
      {selectedSlot && popupPos && (
        <SlotPopup
          slot={selectedSlot}
          position={popupPos}
          onAplicar={handleAplicarSlot}
          onCerrar={handleCerrarPopup}
          soloSeleccion={soloSeleccion}
        />
      )}
    </div>
  )
}
