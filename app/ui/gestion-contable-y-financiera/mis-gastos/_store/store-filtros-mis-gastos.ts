import { create } from 'zustand'

interface FiltrosMisGastos {
  fechaDesde?: Date
  fechaHasta?: Date
  motivoGasto?: string
  cajeroRegistra?: string
  sucursal?: string
  busqueda?: string
}

interface StoreFiltrosMisGastos {
  filtros: FiltrosMisGastos | null
  setFiltros: (filtros: FiltrosMisGastos) => void
  resetFiltros: () => void
}

export const useStoreFiltrosMisGastos = create<StoreFiltrosMisGastos>((set) => ({
  filtros: null,
  setFiltros: (filtros) => set({ filtros }),
  resetFiltros: () => set({ filtros: null }),
}))