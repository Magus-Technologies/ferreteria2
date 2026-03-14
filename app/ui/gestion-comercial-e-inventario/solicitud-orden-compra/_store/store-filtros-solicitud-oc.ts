import { create } from 'zustand'
import { type RequerimientoFilters } from '~/lib/api/requerimiento-interno'

type UseStoreFiltrosSolicitudOCProps = {
  filtros: RequerimientoFilters
  setFiltros: (
    value:
      | RequerimientoFilters
      | ((prev: RequerimientoFilters) => RequerimientoFilters)
  ) => void
}

export const useStoreFiltrosSolicitudOC = create<UseStoreFiltrosSolicitudOCProps>(set => ({
  filtros: { tipo_solicitud: 'SOC' },
  setFiltros: value =>
    set(state => ({
      filtros: typeof value === 'function' ? value(state.filtros) : value,
    })),
}))
