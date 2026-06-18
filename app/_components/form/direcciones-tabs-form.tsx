'use client'

import type { ReactNode } from 'react'
import { Tabs, Input } from 'antd'
import { BsGeoAltFill } from 'react-icons/bs'
import LabelBase from '~/components/form/label-base'
import type {
  DireccionCliente,
  TipoDireccion,
} from '~/lib/api/cliente'

export interface DireccionesTabsFormHook {
  tipos: TipoDireccion[]
  direcciones: DireccionCliente[]
  tipoActivo: TipoDireccion
  setTipoActivo: (tipo: TipoDireccion) => void
  direccionesMapa: Record<TipoDireccion, string>
  actualizarDireccion: (
    tipo: TipoDireccion,
    parche: Partial<DireccionCliente>,
  ) => void
  marcarComoPrincipal: (tipo: TipoDireccion) => void
}

interface DireccionesTabsFormProps {
  /**
   * Resultado de `useDireccionesClienteForm()` — el componente solo lee
   * y dispara updates a través del hook, NO toca el `Form` directamente.
   */
  hook: DireccionesTabsFormHook
  /**
   * Header opcional que se muestra arriba de los tabs (ej. instrucciones
   * "Haz clic en el mapa para marcar ubicación GPS").
   */
  header?: ReactNode
  /**
   * Contenido a renderizar debajo de los tabs — típicamente el mapa.
   * Recibe el `tipoActivo` por si necesita reaccionar al cambio.
   */
  children?: (tipoActivo: TipoDireccion) => ReactNode
}

/**
 * Renderiza los tabs de direcciones dinámicamente a partir del array de
 * `hook.direcciones`. Cada tab tiene los inputs de "Dirección" y
 * "Referencia" controlados por el hook (no por `Form.Item`), por lo que
 * agregar `D5` solo requiere extender `TIPOS_DIRECCION_LIST` — este
 * componente no necesita cambios.
 *
 * El mapa lo provee el caller como `children` (renderProp) para no atar
 * este componente a una librería específica de mapas.
 */
export default function DireccionesTabsForm({
  hook,
  header,
  children,
}: DireccionesTabsFormProps) {
  return (
    <div className="space-y-1">
      {header && (
        <p className="text-sm font-medium text-gray-700">{header}</p>
      )}

      <Tabs
        activeKey={hook.tipoActivo}
        onChange={(key) => hook.setTipoActivo(key as TipoDireccion)}
        size="small"
        items={hook.direcciones.map((d, idx) => {
          const tieneGps = d.latitud != null && d.longitud != null
          const idxLabel = idx + 1
          return {
            key: d.tipo,
            label: (
              <span
                className="text-xs flex items-center gap-1"
                title={d.es_principal ? 'Dirección Principal (clic para quitar)' : 'Marcar como principal'}
              >
                Dirección {idxLabel}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    hook.marcarComoPrincipal(d.tipo)
                  }}
                  className={`ml-0.5 leading-none transition-colors ${
                    d.es_principal
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  aria-label={d.es_principal ? 'Quitar como principal' : 'Marcar como principal'}
                >
                  ★
                </button>
                {tieneGps && ' 📍'}
              </span>
            ),
            children: (
              <div className="space-y-1 [&_.ant-form-item]:!mb-1">
                <LabelBase
                  label={`Dirección ${idxLabel}:`}
                  orientation="column"
                  classNames={{ labelParent: '!mb-0' }}
                >
                  <Input
                    prefix={<BsGeoAltFill className="text-cyan-600 mx-1" />}
                    value={d.direccion}
                    onChange={(e) =>
                      hook.actualizarDireccion(d.tipo, {
                        direccion: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder={
                      idx === 0
                        ? `Dirección ${idxLabel}`
                        : `Dirección ${idxLabel} (opcional)`
                    }
                    autoComplete="new-password"
                    variant="filled"
                  />
                </LabelBase>
                {hook.direccionesMapa[d.tipo] && (
                  <p
                    className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded truncate"
                    title={hook.direccionesMapa[d.tipo]}
                  >
                    Ubicación GPS: {hook.direccionesMapa[d.tipo]}
                  </p>
                )}
                <LabelBase
                  label="Referencia:"
                  orientation="column"
                  classNames={{ labelParent: '!mb-0' }}
                >
                  <Input
                    value={d.referencia ?? ''}
                    onChange={(e) =>
                      hook.actualizarDireccion(d.tipo, {
                        referencia: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Escribe una referencia"
                    autoComplete="new-password"
                    variant="filled"
                  />
                </LabelBase>
              </div>
            ),
          }
        })}
      />

      {children?.(hook.tipoActivo)}
    </div>
  )
}
