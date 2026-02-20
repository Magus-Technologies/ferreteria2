import { create } from 'zustand'

// API-compatible filter interface for gastos
interface FiltrosMisGastos {
  almacen_id?: number
  fechaDesde?: string
  fechaHasta?: string
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