'use client'

import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import { FaMapMarkerAlt, FaCheck, FaCheckCircle, FaStore, FaUser } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import { TIPO_ENTREGA_LABEL, TIPO_ENTREGA_ICON } from '~/app/_lib/entrega-labels'
import type { TipoEntregaCodigo } from '../modals/modal-resumen-entrega-venta'

const TIPOS: { value: TipoEntregaCodigo; emoji: string; label: string }[] = [
  { value: 'rt', emoji: TIPO_ENTREGA_ICON.rt, label: TIPO_ENTREGA_LABEL.rt },
  { value: 'de', emoji: TIPO_ENTREGA_ICON.de, label: TIPO_ENTREGA_LABEL.de },
]

const QUIEN_ENTREGA_OPTS: { value: 'almacen' | 'vendedor'; icon: React.ReactNode; label: string }[] = [
  { value: 'almacen',  icon: <FaStore size={10} />,  label: 'Almacén' },
  { value: 'vendedor', icon: <FaUser  size={10} />,  label: 'Vendedor' },
]

interface Props {
  tipo: TipoEntregaCodigo
  onTipo: (v: TipoEntregaCodigo) => void
  fecha: Dayjs | null
  onFecha: (v: Dayjs | null) => void
  quienEntrega: 'almacen' | 'vendedor'
  onQuienEntrega: (v: 'almacen' | 'vendedor') => void
  itemCount: number
  unidadCount: number
  registrando: boolean
  onMapa: () => void
  onProgramar: () => void
  onCancelar: () => void
  completada?: boolean
  domicilioConfigurado?: boolean
  domicilioDireccion?: string
}

export default function CardControlesEntrega({
  tipo, onTipo, fecha, onFecha,
  quienEntrega, onQuienEntrega,
  itemCount, unidadCount,
  registrando, onMapa, onProgramar, onCancelar,
  completada = false,
  domicilioConfigurado = false,
  domicilioDireccion,
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
              <button
                key={opt.value}
                type="button"
                onClick={completada ? undefined : () => onTipo(opt.value)}
                disabled={completada}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${
                  completada
                    ? sel
                      ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-default'
                      : 'border-slate-200 bg-white text-slate-300 cursor-default'
                    : sel
                    ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                <span className="text-base leading-none">{opt.emoji}</span>
                <span className="text-[11px] leading-tight font-medium flex-1">{opt.label}</span>
                <FaCheck size={9} className={`flex-shrink-0 transition-opacity ${sel ? 'opacity-60' : 'opacity-0'}`} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Quien entrega — solo aplica para recojo en tienda */}
      {tipo === 'rt' && (
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Quien entrega</p>
        <div className="flex gap-1">
          {QUIEN_ENTREGA_OPTS.map(opt => {
            const sel = quienEntrega === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={completada ? undefined : () => onQuienEntrega(opt.value)}
                disabled={completada}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all ${
                  completada
                    ? sel
                      ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-default'
                      : 'border-slate-200 bg-white text-slate-300 cursor-default'
                    : sel
                    ? 'border-blue-500 bg-blue-50 text-blue-700 cursor-pointer'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 cursor-pointer'
                }`}
              >
                {opt.icon}
                <span className="text-[11px] font-medium">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>
      )}

      {/* Fecha */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Fecha programada</p>
        <DatePicker
          value={fecha} onChange={completada ? undefined : onFecha}
          size="small" placeholder="Sin fecha" format="DD/MM/YYYY"
          allowClear={!completada} disabled={completada}
          style={{ width: '100%' }}
        />
      </div>

      {/* Resumen / Banner completada */}
      {completada ? (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-3 text-center flex flex-col items-center gap-1.5">
          <FaCheckCircle size={22} className="text-green-500" />
          <p className="text-[12px] font-bold text-green-700 leading-snug">Entrega completada</p>
          <p className="text-[10px] text-green-500">Todos los productos fueron entregados</p>
        </div>
      ) : hasItems ? (
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
        {completada ? (
          <button type="button" onClick={onCancelar}
            className="w-full text-[11px] text-slate-400 hover:text-slate-600 py-1 transition-colors cursor-pointer">
            Cerrar
          </button>
        ) : (
          <>
            <ButtonBase
              disabled={tipo !== 'de' || !hasItems} onClick={onMapa}
              className="w-full flex items-center justify-center gap-1.5 border-blue-400 !text-blue-700 hover:bg-blue-50 text-xs !h-8">
              <FaMapMarkerAlt size={11} />
              {tipo === 'de' && domicilioConfigurado ? 'Cambiar Dirección' : 'Mapa / Dirección'}
            </ButtonBase>

            {/* Badge de dirección configurada */}
            {tipo === 'de' && domicilioConfigurado && domicilioDireccion && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-2">
                <div className="flex items-center gap-1 mb-0.5">
                  <FaCheckCircle size={9} className="text-green-500 flex-shrink-0" />
                  <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Dirección configurada</span>
                </div>
                <p className="text-[11px] text-green-800 leading-snug line-clamp-2">{domicilioDireccion}</p>
              </div>
            )}

            <ButtonBase
              color="success" size="md"
              disabled={!hasItems || registrando || (tipo === 'de' && !domicilioConfigurado)}
              onClick={onProgramar}
              title={tipo === 'de' && !domicilioConfigurado ? 'Primero seleccioná la dirección con "Mapa / Dirección"' : undefined}
              className="w-full flex items-center justify-center gap-1.5 text-xs !h-9 disabled:opacity-40">
              <FaCheck size={11} /> {registrando ? 'Registrando...' : 'Programar Entrega'}
            </ButtonBase>
            <button type="button" onClick={onCancelar}
              className="w-full text-[11px] text-slate-400 hover:text-slate-600 py-1 transition-colors cursor-pointer">
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
