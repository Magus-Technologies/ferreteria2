import { create } from 'zustand'
import type { GetProductosParams } from '~/app/_types/producto'

type UseStoreFiltrosProductosProps = {
  filtros?: Partial<GetProductosParams>
  setFiltros: (
    value:
      | Partial<GetProductosParams>
      | undefined
      | ((
          prev?: Partial<GetProductosParams>
        ) => Partial<GetProductosParams> | undefined)
  ) => void
}

export const useStoreFiltrosProductos = create<UseStoreFiltrosProductosProps>(
  (set) => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => {
          const newValue = typeof value === 'function' ? value(state.filtros) : value
          // Evitar actualizaciones innecesarias si el valor es el mismo
          if (JSON.stringify(newValue) === JSON.stringify(state.filtros)) {
            return state
          }
          return { filtros: newValue }
        }),
    }
  }
)
