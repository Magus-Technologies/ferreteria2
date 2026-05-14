import { create } from 'zustand'

export interface ProveedorFilters {
  search?: string
  estado?: boolean
  calificacion?: string // 'excelente' | 'bueno' | 'regular' | 'malo'
  tipo_proveedor?: 'empresa' | 'persona'
  ordenar_por?: 'compras' // solo se envía si está activado
}

interface StoreFiltrosMisProveedores {
  filtros: ProveedorFilters
  setFiltros: (filtros: ProveedorFilters) => void
}

export const useStoreFiltrosMisProveedores = create<StoreFiltrosMisProveedores>((set) => ({
  filtros: { estado: true },
  setFiltros: (filtros: ProveedorFilters) => set({ filtros }),
}))
