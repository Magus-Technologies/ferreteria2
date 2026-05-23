import { create } from 'zustand'
import dayjs from 'dayjs'
import { type RequerimientoFilters } from '~/lib/api/requerimiento-interno'

type UseStoreFiltrosMisOSProps = {
  filtros: RequerimientoFilters
  setFiltros: (
    value:
      | RequerimientoFilters
      | ((prev: RequerimientoFilters) => RequerimientoFilters)
  ) => void
}

// Importante: usar dayjs (fecha LOCAL) en vez de new Date().toISOString()
// que devuelve UTC y desfasa un día en horario de tarde/noche en GMT-5.
const hoyLocal = dayjs().format('YYYY-MM-DD')

export const useStoreFiltrosMisOS = create<UseStoreFiltrosMisOSProps>(set => ({
  filtros: {
    tipo_solicitud: 'OS',
    estado: 'pendiente',
    desde: hoyLocal,
    hasta: hoyLocal,
  },
  setFiltros: value =>
    set(state => ({
      filtros: typeof value === 'function' ? value(state.filtros) : value,
    })),
}))
