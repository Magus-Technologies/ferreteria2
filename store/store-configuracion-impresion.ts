import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TipoDocumento = 
  | 'ingreso_salida' 
  | 'venta' 
  | 'cotizacion' 
  | 'prestamo' 
  | 'recepcion_almacen' 
  | 'compra'

export interface ConfiguracionCampo {
  font_family: string
  font_size: number
  font_weight: 'normal' | 'bold'
}

// Configuraciones por tipo de documento y campo
// Ejemplo: { ingreso_salida: { tabla_cantidad: { font_family: 'Arial', font_size: 12, font_weight: 'bold' } } }
type ConfiguracionesPorTipo = Record<TipoDocumento, Record<string, ConfiguracionCampo>>

interface ConfiguracionImpresionState {
  configuraciones: Partial<ConfiguracionesPorTipo>
  setConfiguracionCampo: (tipo: TipoDocumento, campo: string, config: ConfiguracionCampo) => void
  getConfiguracionCampo: (tipo: TipoDocumento, campo: string) => ConfiguracionCampo
  setConfiguracionesCompletas: (tipo: TipoDocumento, configs: Record<string, ConfiguracionCampo>) => void
  resetConfiguracionCampo: (tipo: TipoDocumento, campo: string) => void
  resetConfiguracionesCompletas: (tipo: TipoDocumento) => void
}

const defaultConfig: ConfiguracionCampo = {
  font_family: 'Arial',
  font_size: 8,
  font_weight: 'normal',
}

export const useStoreConfiguracionImpresion = create<ConfiguracionImpresionState>()(
  persist(
    (set, get) => ({
      configuraciones: {},
      
      setConfiguracionCampo: (tipo, campo, config) => 
        set(state => ({
          configuraciones: {
            ...state.configuraciones,
            [tipo]: {
              ...(state.configuraciones[tipo] || {}),
              [campo]: config,
            },
          },
        })),
      
      getConfiguracionCampo: (tipo, campo) => {
        const configTipo = get().configuraciones[tipo]
        if (!configTipo) return defaultConfig
        return configTipo[campo] || defaultConfig
      },

      setConfiguracionesCompletas: (tipo, configs) =>
        set(state => ({
          configuraciones: {
            ...state.configuraciones,
            [tipo]: configs,
          },
        })),
      
      resetConfiguracionCampo: (tipo, campo) =>
        set(state => {
          const newConfigs = { ...state.configuraciones }
          if (newConfigs[tipo]) {
            const newConfigsTipo = { ...newConfigs[tipo] }
            delete newConfigsTipo[campo]
            newConfigs[tipo] = newConfigsTipo
          }
          return { configuraciones: newConfigs }
        }),

      resetConfiguracionesCompletas: (tipo) =>
        set(state => {
          const newConfigs = { ...state.configuraciones }
          delete newConfigs[tipo]
          return { configuraciones: newConfigs }
        }),
    }),
    {
      name: 'configuracion-impresion-storage',
    }
  )
)
