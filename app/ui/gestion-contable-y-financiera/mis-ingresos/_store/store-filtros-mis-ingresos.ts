import { create } from 'zustand'

// Simple filter interface for ingresos
interface FiltrosIngresos {
  almacen_id?: number
  fecha?: {
    gte?: string
    lte?: string
  }
  user_id?: string
  OR?: Array<{
    concepto?: { contains: string }
    comentario?: { contains: string }
    monto?: number
  }>
  concepto?: { contains: string }
}

interface StoreFiltrosMisIngresos {
  filtros: FiltrosIngresos | null
  setFiltros: (filtros: FiltrosIngresos) => void
}

export const useStoreFiltrosMisIngresos = create<StoreFiltrosMisIngresos>(set => ({
  filtros: null,
  setFiltros: filtros => set({ filtros }),
}))