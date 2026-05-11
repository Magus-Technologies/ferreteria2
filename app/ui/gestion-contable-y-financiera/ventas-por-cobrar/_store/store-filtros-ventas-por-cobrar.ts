import type { VentaWhereInput } from '~/types'
import { create } from 'zustand'

export type MoraRango = 'hoy' | 7 | 15 | 30 | 60 | 'todas' | 'vencidas'
export type EstadoPago = 'pendientes' | 'pagadas' | 'todas'

interface StoreFiltrosVentasPorCobrar {
  filtros: VentaWhereInput | undefined
  searchKey: number
  setFiltros: (filtros: VentaWhereInput) => void
  moraRango: MoraRango
  setMoraRango: (rango: MoraRango) => void
  estadoPago: EstadoPago
  setEstadoPago: (estado: EstadoPago) => void
  quickFilterText: string
  setQuickFilterText: (text: string) => void
  resetToDefaults: () => void
}

const DEFAULT_VALUES = {
  moraRango: 15 as MoraRango,
  estadoPago: 'pendientes' as EstadoPago,
}

export const useStoreFiltrosVentasPorCobrar = create<StoreFiltrosVentasPorCobrar>((set) => ({
  filtros: undefined,
  searchKey: 0,
  setFiltros: (filtros) => set((state) => ({ filtros, searchKey: state.searchKey + 1 })),
  moraRango: DEFAULT_VALUES.moraRango,
  setMoraRango: (moraRango) => set({ moraRango }),
  estadoPago: DEFAULT_VALUES.estadoPago,
  setEstadoPago: (estadoPago) => set({ estadoPago }),
  quickFilterText: '',
  setQuickFilterText: (quickFilterText) => set({ quickFilterText }),
  resetToDefaults: () => set({
    moraRango: DEFAULT_VALUES.moraRango,
    estadoPago: DEFAULT_VALUES.estadoPago,
    quickFilterText: '',
  }),
}))
