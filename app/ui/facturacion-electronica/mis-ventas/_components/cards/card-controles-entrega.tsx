'use client'

import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import { FaMapMarkerAlt, FaCheck } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { TIPO_ENTREGA_LABEL, TIPO_ENTREGA_ICON } from '~/app/_lib/entrega-labels'
import type { TipoEntregaCodigo } from '../modals/modal-resumen-entrega-venta'

const TIPOS: { value: TipoEntregaCodigo; emoji: string; label: string }[] = [
  { value: 'rt', emoji: TIPO_ENTREGA_ICON.rt, label: TIPO_ENTREGA_LABEL.rt },
  { value: 'de', emoji: TIPO_ENTREGA_ICON.de, label: TIPO_ENTREGA_LABEL.de },
  { value: 'pa', emoji: TIPO_ENTREGA_ICON.pa, label: TIPO_ENTREGA_LABEL.pa },
]

interface Props {
  tipo: TipoEntregaCodigo
  onTipo: (v: TipoEntregaCodigo) => void
  fecha: Dayjs | null
  onFecha: (v: Dayjs | null) => void
  itemCount: number
  unidadCount: number
  registrando: boolean
  onMapa: () => void
  onProgramar: () => void
  onCancelar: () => void
}

export default function CardControlesEntrega({
  tipo, onTipo, fecha, onFecha,
  itemCount, unidadCount,
  registrando, onMapa, onProgramar, onCancelar,
}: Props) {
  const hasItems = itemCount > 0

  return (
    <div className="w-52 flex-shrink-0 flex flex-col gap-3">

      {/* Tipo de entrega */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tipo de entrega</p>
        <div className="flex flex-col gap-1">
          {TIPOS.map(opt => {
            const sel = tipo === opt.value
            return (
              <button key={opt.value} type="button" onClick={() => onTipo(opt.value)}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all cursor-pointer ${
                  sel
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                }`}>
                <span className="text-base leading-none">{opt.emoji}</span>
                <span className="text-[11px] leading-tight font-medium flex-1">{opt.label}</span>
                <FaCheck size={9} className={`flex-shrink-0 transition-opacity ${sel ? 'text-blue-500 opacity-100' : 'opacity-0'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Fecha */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Fecha programada</p>
        <DatePicker value={fecha} onChange={onFecha} size="small" placeholder="Sin fecha"
          format="DD/MM/YYYY" allowClear style={{ width: '100%' }} />
      </div>

      {/* Resumen */}
      {hasItems ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">Esta entrega</p>
          <div className="flex items-end gap-3">
            <div>
              <span className="text-xl font-extrabold text-blue-700 leading-none">{itemCount}</span>
              <span className="text-[10px] text-blue-400 ml-1">ítem{itemCount !== 1 ? 's' : ''}</span>
            </div>
            <div className="h-6 w-px bg-blue-200" />
            <div>
              <span className="text-xl font-extrabold text-blue-700 leading-none">{unidadCount}</span>
              <span className="text-[10px] text-blue-400 ml-1">und.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center">
          <p className="text-[11px] text-slate-400">Sin cantidades a programar</p>
        </div>
      )}

      <div className="flex-1" />

      {/* Acciones */}
      <div className="flex flex-col gap-1.5 pt-2.5 border-t border-slate-100">
        <ButtonBase
          disabled={tipo !== 'de' || !hasItems} onClick={onMapa}
          className="w-full flex items-center justify-center gap-1.5 border-blue-400 !text-blue-700 hover:bg-blue-50 text-xs !h-8">
          <FaMapMarkerAlt size={11} /> Mapa / Dirección
        </ButtonBase>
        <ButtonBase
          color="success" size="md"
          disabled={!hasItems || registrando}
          onClick={onProgramar}
          className="w-full flex items-center justify-center gap-1.5 text-xs !h-9">
          <FaCheck size={11} /> {registrando ? 'Registrando...' : 'Programar Entrega'}
        </ButtonBase>
        <button type="button" onClick={onCancelar}
          className="w-full text-[11px] text-slate-400 hover:text-slate-600 py-1 transition-colors cursor-pointer">
          Cancelar
        </button>
      </div>
    </div>
  )
}
