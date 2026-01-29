import { create } from 'zustand'
import type { PrestamoFilters } from '~/lib/api/prestamo'

type UseStoreFiltrosMisPrestamosProps = {
  filtros?: PrestamoFilters
  setFiltros: (filtros: PrestamoFilters) => void
}

export const useStoreFiltrosMisPrestamos =
  create<UseStoreFiltrosMisPrestamosProps>(set => {
    return {
      filtros: undefined,
      setFiltros: filtros => set({ filtros }),
    }
  })
