import type { CompraWhereInput } from '~/types'
import { create } from 'zustand'

export type MoraRango = 'hoy' | 7 | 15 | 30 | 60 | 'todas' | 'vencidas'
export type EstadoPago = 'pendientes' | 'pagadas' | 'todas'

interface StoreFiltrosComprasPorPagar {
  filtros: CompraWhereInput | undefined
  setFiltros: (filtros: CompraWhereInput) => void
  moraRango: MoraRango
  setMoraRango: (rango: MoraRango) => void
  estadoPago: EstadoPago
  setEstadoPago: (estado: EstadoPago) => void
  quickFilterText: string
  setQuickFilterText: (text: string) => void
}

export const useStoreFiltrosComprasPorPagar = create<StoreFiltrosComprasPorPagar>((set) => ({
  filtros: undefined,
  setFiltros: (filtros) => set({ filtros }),
  moraRango: 15,
  setMoraRango: (moraRango) => set({ moraRango }),
  estadoPago: 'pendientes',
  setEstadoPago: (estadoPago) => set({ estadoPago }),
  quickFilterText: '',
  setQuickFilterText: (quickFilterText) => set({ quickFilterText }),
}))