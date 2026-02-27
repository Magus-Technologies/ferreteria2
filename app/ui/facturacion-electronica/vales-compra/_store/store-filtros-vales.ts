import { create } from 'zustand'
import type { EstadoVale, TipoPromocion, Modalidad } from '~/lib/api/vales-compra'

export interface FiltrosVales {
  search?: string
  estado?: EstadoVale
  tipo_promocion?: TipoPromocion
  modalidad?: Modalidad
}

interface StoreFiltrosVales {
  filtros: FiltrosVales
  setFiltros: (filtros: FiltrosVales) => void
  resetFiltros: () => void
}

const filtrosIniciales: FiltrosVales = {
  estado: 'ACTIVO',
}

export const useStoreFiltrosVales = create<StoreFiltrosVales>((set) => ({
  filtros: filtrosIniciales,
  setFiltros: (filtros) => set({ filtros }),
  resetFiltros: () => set({ filtros: filtrosIniciales }),
}))
