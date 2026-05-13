import { create } from 'zustand'

export interface ProveedorFilters {
  search?: string
  estado?: boolean
  calificacion?: string
  ordenar_por?: 'compras' // solo se envía si está activado
}

interface StoreFiltrosMisProveedores {
  filtros: ProveedorFilters
  setFiltros: (filtros: ProveedorFilters) => void
}

export const useStoreFiltrosMisProveedores = create<StoreFiltrosMisProveedores>((set) => ({
  filtros: {},
  setFiltros: (filtros: ProveedorFilters) => set({ filtros }),
}))
