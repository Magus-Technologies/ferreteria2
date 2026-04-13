import { create } from 'zustand'
import { type RequerimientoFilters } from '~/lib/api/requerimiento-interno'

type UseStoreFiltrosMisOSProps = {
  filtros: RequerimientoFilters
  setFiltros: (
    value:
      | RequerimientoFilters
      | ((prev: RequerimientoFilters) => RequerimientoFilters)
  ) => void
}

export const useStoreFiltrosMisOS = create<UseStoreFiltrosMisOSProps>(set => ({
  filtros: { tipo_solicitud: 'OS', desde: new Date().toISOString().split('T')[0], hasta: new Date().toISOString().split('T')[0] },
  setFiltros: value =>
    set(state => ({
      filtros: typeof value === 'function' ? value(state.filtros) : value,
    })),
}))
