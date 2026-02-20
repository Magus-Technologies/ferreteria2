import { create } from 'zustand'

// API-compatible filter interface for ingresos
interface FiltrosIngresos {
  almacen_id?: number
  desde?: string
  hasta?: string
  user_id?: string
  concepto?: string
  search?: string
}

interface StoreFiltrosMisIngresos {
  filtros: FiltrosIngresos | null
  setFiltros: (filtros: FiltrosIngresos) => void
  resetFiltros: () => void
}

export const useStoreFiltrosMisIngresos = create<StoreFiltrosMisIngresos>(set => ({
  filtros: null,
  setFiltros: filtros => set({ filtros }),
  resetFiltros: () => set({ filtros: null }),
}))