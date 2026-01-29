'use client'

import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState, useMemo, useCallback } from 'react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-styles.css'
import { useEntregasProgramadas } from '~/hooks/use-entregas-programadas'
import EventEntrega, { EntregaEvent } from './event-entrega'
import dayjs from 'dayjs'

// Configurar localizador en español
const locales = {
  es: es,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: es }),
  getDay,
  locales,
})

// Colores por chofer (se pueden personalizar)
const CHOFER_COLORS = [
  '#86efac', // verde claro
  '#fde047', // amarillo
  '#93c5fd', // azul claro
  '#fca5a5', // rojo claro
  '#c4b5fd', // morado claro
  '#fdba74', // naranja claro
]

interface CalendarProgramacionEntregasProps {
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
  onSelectEvent?: (event: EntregaEvent) => void
  selectedDate?: Date
  chofer_id?: string
}

export default function CalendarProgramacionEntregas({
  onSelectSlot,
  onSelectEvent,
  selectedDate,
  chofer_id,
}: CalendarProgramacionEntregasProps) {
  const [view, setView] = useState<View>('day')
  const [date, setDate] = useState(selectedDate || new Date())
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  // Calcular rango de fechas para la consulta
  const { fecha_desde, fecha_hasta } = useMemo(() => {
    const desde = dayjs(date).subtract(7, 'days').format('YYYY-MM-DD')
    const hasta = dayjs(date).add(7, 'days').format('YYYY-MM-DD')
    return { fecha_desde: desde, fecha_hasta: hasta }
  }, [date])

  // Obtener entregas programadas
  const { data: entregas = [], isLoading } = useEntregasProgramadas({
    fecha_desde,
    fecha_hasta,
    chofer_id,
  })

  // Transformar entregas a eventos del calendario
  const events: EntregaEvent[] = useMemo(() => {
    const choferColorMap = new Map<string, string>()
    let colorIndex = 0

    const entregasEvents = entregas.map((entrega: any) => {
      // Determinar color según estado
      let color: string
      
      if (entrega.estado_entrega === 'en') {
        // Entregado = Verde brillante
        color = '#22c55e'
      } else if (entrega.estado_entrega === 'ec') {
        // En Camino = Amarillo brillante
        color = '#eab308'
      } else {
        // Pendiente = Asignar color por chofer
        if (!choferColorMap.has(entrega.chofer_id)) {
          choferColorMap.set(entrega.chofer_id, CHOFER_COLORS[colorIndex % CHOFER_COLORS.length])
          colorIndex++
        }
        color = choferColorMap.get(entrega.chofer_id) || CHOFER_COLORS[0]
      }

      // Parsear fecha y horas
      const fechaProgramada = entrega.fecha_programada || entrega.fecha_entrega
      const horaInicio = entrega.hora_inicio || '08:00'
      const horaFin = entrega.hora_fin || '09:00'

      const start = dayjs(`${fechaProgramada} ${horaInicio}`).toDate()
      const end = dayjs(`${fechaProgramada} ${horaFin}`).toDate()

      const clienteNombre = entrega.venta?.cliente?.razon_social ||
        `${entrega.venta?.cliente?.nombres || ''} ${entrega.venta?.cliente?.apellidos || ''}`.trim() ||
        'Cliente'

      return {
        id: entrega.id,
        title: `${entrega.chofer?.name || 'Chofer'} - ${clienteNombre}`,
        start,
        end,
        resource: {
          venta_id: entrega.venta_id,
          chofer_id: entrega.chofer_id,
          chofer_nombre: entrega.chofer?.name || 'Chofer',
          cliente_nombre: clienteNombre,
          direccion: entrega.direccion_entrega || '',
          productos_count: entrega.productos_entregados?.length || 0,
          color,
        },
      }
    })

    // Agregar evento temporal para la selección actual (PERSISTENTE)
    if (selectedSlot) {
      entregasEvents.push({
        id: -1,
        title: '📅 Selección Actual',
        start: selectedSlot.start,
        end: selectedSlot.end,
        resource: {
          venta_id: '',
          chofer_id: '',
          chofer_nombre: '📅 Nueva Entrega',
          cliente_nombre: 'Click para programar',
          direccion: '',
          productos_count: 0,
          color: '#60a5fa', // Azul más visible
        },
      })
    }

    return entregasEvents
  }, [entregas, selectedSlot])

  // Personalizar formatos de fecha en español
  const formats = {
    dateFormat: 'dd',
    dayFormat: (date: Date) => format(date, 'EEEE', { locale: es }),
    dayHeaderFormat: (date: Date) => format(date, 'EEEE d', { locale: es }),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`,
    monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: es }),
    weekdayFormat: (date: Date) => format(date, 'EEEE', { locale: es }),
    timeGutterFormat: (date: Date) => format(date, 'HH:mm', { locale: es }),
  }

  // Personalizar mensajes en español
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

  // Configurar horario de trabajo (7 AM - 7 PM)
  const minTime = useMemo(() => new Date(1970, 1, 1, 7, 0, 0), [])
  const maxTime = useMemo(() => new Date(1970, 1, 1, 19, 0, 0), [])

  // Manejar selección de slot (crear nueva entrega)
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; action: string }) => {
      if (slotInfo.action === 'select' || slotInfo.action === 'click') {
        setSelectedSlot({ start: slotInfo.start, end: slotInfo.end })
        onSelectSlot?.(slotInfo)
      }
    },
    [onSelectSlot]
  )

  // Manejar clic en evento (ver/editar entrega)
  const handleSelectEvent = useCallback(
    (event: EntregaEvent) => {
      // Si es el evento temporal de selección, no hacer nada
      if (event.id === -1) {
        return
      }
      
      setSelectedEventId(event.id)
      onSelectEvent?.(event)
    },
    [onSelectEvent]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 rounded-lg">
        <div className="text-gray-500">Cargando calendario...</div>
      </div>
    )
  }

  return (
    <div className="h-[500px] bg-white rounded-lg p-4">
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
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        step={30} // Intervalos de 30 minutos
        timeslots={2} // 2 slots por hora
        min={minTime}
        max={maxTime}
        components={{
          event: EventEntrega,
        }}
        eventPropGetter={(event: EntregaEvent) => ({
          style: {
            backgroundColor: event.resource.color,
            borderColor: event.resource.color,
            color: '#000',
            border: event.id === -1 ? '2px dashed #3b82f6' : '1px solid rgba(0,0,0,0.1)',
            opacity: event.id === -1 ? 0.9 : 1,
            fontWeight: '600',
            boxShadow: event.id === selectedEventId ? '0 0 0 3px rgba(59, 130, 246, 0.5)' : undefined,
          },
        })}
      />
    </div>
  )
}
