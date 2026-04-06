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
          return { filtros: { ...newValue, _searchId: Date.now() } }
        }),
    }
  }
)
