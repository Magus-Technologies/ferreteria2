import { create } from 'zustand'
import type { CompraWhereInput } from '~/types'

type UseStoreFiltrosComprasEnEsperaProps = {
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

export const useStoreFiltrosComprasEnEspera =
  create<UseStoreFiltrosComprasEnEsperaProps>(set => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  })
