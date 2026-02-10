import { create } from 'zustand'
import { RecepcionAlmacenFilters } from '~/lib/api/recepcion-almacen'

type UseStoreFiltrosMisRecepcionesProps = {
  filtros?: RecepcionAlmacenFilters
  setFiltros: (
    value:
      | RecepcionAlmacenFilters
      | undefined
      | ((
          prev?: RecepcionAlmacenFilters
        ) => RecepcionAlmacenFilters | undefined)
  ) => void
}

export const useStoreFiltrosMisRecepciones =
  create<UseStoreFiltrosMisRecepcionesProps>(set => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  })
