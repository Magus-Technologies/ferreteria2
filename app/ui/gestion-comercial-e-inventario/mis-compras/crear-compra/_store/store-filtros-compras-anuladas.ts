import { create } from 'zustand'
import type { CompraWhereInput } from '~/types'

type UseStoreFiltrosComprasAnuladasProps = {
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

export const useStoreFiltrosComprasAnuladas =
  create<UseStoreFiltrosComprasAnuladasProps>(set => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  })
