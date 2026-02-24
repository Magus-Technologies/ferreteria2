import { create } from 'zustand'

// API-compatible filter interface for Ingresos
interface FiltrosMisIngresos {
  almacen_id?: number
  fechaDesde?: string
  fechaHasta?: string
  motivoIngreso?: string
  cajeroRegistra?: string
  sucursal?: string
  busqueda?: string
}

interface StoreFiltrosMisIngresos {
  filtros: FiltrosMisIngresos | null
  setFiltros: (filtros: FiltrosMisIngresos) => void
  resetFiltros: () => void
}

export const useStoreFiltrosMisIngresos = create<StoreFiltrosMisIngresos>((set) => ({
  filtros: null,
  setFiltros: (filtros) => set({ filtros }),
  resetFiltros: () => set({ filtros: null }),
}))
