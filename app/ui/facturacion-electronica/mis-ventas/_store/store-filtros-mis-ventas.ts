import { create } from 'zustand'
import type { VentaFilters } from '~/lib/api/venta'

type UseStoreFiltrosMisVentasProps = {
  filtros?: VentaFilters
  setFiltros: (filtros: VentaFilters) => void
}

export const useStoreFiltrosMisVentas =
  create<UseStoreFiltrosMisVentasProps>(set => {
    return {
      filtros: undefined,
      setFiltros: filtros => set({ filtros }),
    }
  })
