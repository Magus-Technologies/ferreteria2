'use client'

import { Popover } from 'antd'
import { FaInfoCircle } from 'react-icons/fa'

/**
 * Botón ℹ️ que muestra TODOS los precios de la unidad derivada con su
 * "activador" (cantidad mínima para desbloquearlo) y si está activo o no
 * para la cantidad actual. Resume de un vistazo qué precio aplica y desde
 * qué cantidad — el mismo criterio que usa SelectPrecios para gatear.
 */
const TIERS = [
  { key: 'precio_publico', label: 'Público', activadorKey: null as string | null },
  { key: 'precio_especial', label: 'Ferretería', activadorKey: 'activador_especial' },
  { key: 'precio_minimo', label: 'Mínimo', activadorKey: 'activador_minimo' },
  { key: 'precio_ultimo', label: 'Final', activadorKey: 'activador_ultimo' },
]

interface InfoActivadoresPreciosProps {
  unidadDerivada: any | undefined | null
  cantidad?: number
}

export default function InfoActivadoresPrecios({
  unidadDerivada,
  cantidad = 0,
}: InfoActivadoresPreciosProps) {
  if (!unidadDerivada) return null

  const cant = Number(cantidad || 0)

  const rows = TIERS.map((t) => {
    const precio = Number(unidadDerivada[t.key] ?? 0)
    const activador = t.activadorKey ? Number(unidadDerivada[t.activadorKey] ?? 0) : 0
    const tieneActivador = activador > 0
    const activo = !tieneActivador || cant >= activador
    return { ...t, precio, activador, tieneActivador, activo }
  })

  const content = (
    <div className="min-w-[300px]">
      <p className="text-xs text-slate-500 mb-2">
        Cantidad actual: <b className="text-slate-700">{cant}</b>. Cada precio se
        activa al alcanzar su cantidad mínima.
      </p>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            <th className="py-1 pr-2 font-semibold">Precio</th>
            <th className="py-1 px-2 font-semibold text-right">Valor</th>
            <th className="py-1 px-2 font-semibold text-center">Desde</th>
            <th className="py-1 pl-2 font-semibold text-center">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className={`border-b last:border-0 ${r.activo ? '' : 'opacity-60'}`}
            >
              <td className="py-1.5 pr-2 font-medium text-slate-700">{r.label}</td>
              <td className="py-1.5 px-2 text-right">
                S/ {r.precio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-1.5 px-2 text-center text-slate-500">
                {r.tieneActivador ? `${r.activador} und` : '—'}
              </td>
              <td className="py-1.5 pl-2 text-center whitespace-nowrap">
                {r.activo ? (
                  <span className="text-green-600 font-semibold">✓ Activo</span>
                ) : (
                  <span className="text-orange-600">faltan {r.activador - cant}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <Popover content={content} title="Precios y activadores" trigger="click" placement="left">
      <button
        type="button"
        aria-label="Ver precios y activadores"
        className="text-cyan-600 hover:text-cyan-800 transition-colors flex items-center"
        onClick={(e) => e.preventDefault()}
      >
        <FaInfoCircle size={16} />
      </button>
    </Popover>
  )
}
