import { create } from 'zustand'
import type { CompraWhereInput } from '~/types'

type UseStoreFiltrosMisComprasProps = {
  filtros?: CompraWhereInput
  setFiltros: (
    value:
      | CompraWhereInput
      | undefined
      | ((
          prev?: CompraWhereInput
        ) => CompraWhereInput | undefined)
  ) => void
}

export const useStoreFiltrosMisCompras = create<UseStoreFiltrosMisComprasProps>(
  set => {
    return {
      filtros: {}, // Inicializar con objeto vacío en lugar de undefined
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  }
)
