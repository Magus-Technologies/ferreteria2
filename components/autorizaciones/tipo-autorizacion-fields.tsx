'use client'

import { Radio, Space } from 'antd'

export type TipoAprobacion = 'temporal' | 'permanente' | 'una_vez'

export const DURACIONES = [
  { label: '1 hora', value: 1 },
  { label: '4 horas', value: 4 },
  { label: '8 horas', value: 8 },
  { label: '24 horas', value: 24 },
  { label: '3 días', value: 72 },
  { label: '7 días', value: 168 },
  { label: '30 días', value: 720 },
]

interface TipoAutorizacionFieldsProps {
  tipo: TipoAprobacion
  setTipo: (tipo: TipoAprobacion) => void
  duracion: number
  setDuracion: (horas: number) => void
}

/**
 * Selector de tipo de autorización (Temporal / Permanente / Una sola vez) + la
 * duración cuando es temporal. Compartido entre el modal "Resolver Solicitud"
 * (aprobar) y el modal de override con clave de supervisor, para no duplicar UI.
 */
export default function TipoAutorizacionFields({
  tipo,
  setTipo,
  duracion,
  setDuracion,
}: TipoAutorizacionFieldsProps) {
  return (
    <>
      <div>
        <label className="text-sm font-semibold text-gray-700 block mb-2">
          Tipo de autorización:
        </label>
        <Radio.Group value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full">
          <Space direction="vertical" className="w-full">
            <Radio value="temporal">
              <span className="font-medium">Temporal</span>
              <span className="text-xs text-gray-400 ml-2">— por un tiempo limitado</span>
            </Radio>
            <Radio value="permanente">
              <span className="font-medium">Permanente</span>
              <span className="text-xs text-gray-400 ml-2">— sin límite de tiempo</span>
            </Radio>
            <Radio value="una_vez">
              <span className="font-medium">Una sola vez</span>
              <span className="text-xs text-gray-400 ml-2">— se consume al usarla una vez</span>
            </Radio>
          </Space>
        </Radio.Group>
      </div>

      {tipo === 'temporal' && (
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">Duración:</label>
          <div className="flex flex-wrap gap-2">
            {DURACIONES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuracion(d.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
                  ${duracion === d.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
