import type { VentaWhereInput } from '~/types'
import { create } from 'zustand'

interface StoreFiltrosVentasPorCobrar {
  filtros: VentaWhereInput | undefined
  setFiltros: (filtros: VentaWhereInput) => void
}

export const useStoreFiltrosVentasPorCobrar = create<StoreFiltrosVentasPorCobrar>((set) => ({
  filtros: undefined,
  setFiltros: (filtros) => set({ filtros }),
}))
