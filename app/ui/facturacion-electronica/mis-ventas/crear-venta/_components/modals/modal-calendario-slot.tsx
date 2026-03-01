'use client'

import { Modal } from 'antd'
import { useState, Suspense, lazy } from 'react'
import { Spin } from 'antd'
import ButtonBase from '~/components/buttons/button-base'
import { FaCalendar, FaCheck } from 'react-icons/fa'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const CalendarProgramacionEntregas = lazy(
  () => import('~/app/_components/calendar/calendar-programacion-entregas')
)

interface SlotSeleccionado {
  start: Date
  end: Date
}

interface ModalCalendarioSlotProps {
  open: boolean
  onClose: () => void
  onAplicar: (slot: SlotSeleccionado) => void
  chofer_id?: string
}

export default function ModalCalendarioSlot({
  open,
  onClose,
  onAplicar,
  chofer_id,
}: ModalCalendarioSlotProps) {
  const [slotPendiente, setSlotPendiente] = useState<SlotSeleccionado | null>(null)

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
        <div className="flex items-center gap-2">
          <FaCalendar className="text-amber-500" />
          <span className="font-bold text-slate-700">Elegir fecha y hora de entrega</span>
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
        <div className="h-full">
          <CalendarProgramacionEntregas
            onSelectSlot={handleSelectSlot}
            onSelectEvent={() => {}}
            soloSeleccion
            chofer_id={chofer_id}
          />
        </div>
      </Suspense>
    </Modal>
  )
}
