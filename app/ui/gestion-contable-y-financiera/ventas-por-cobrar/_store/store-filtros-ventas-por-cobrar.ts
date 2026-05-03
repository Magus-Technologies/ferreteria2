import type { VentaWhereInput } from '~/types'
import { create } from 'zustand'

export type MoraRango = 'hoy' | 7 | 15 | 30 | 60 | 'todas' | 'vencidas'
export type EstadoPago = 'pendientes' | 'pagadas' | 'todas'

interface StoreFiltrosVentasPorCobrar {
  filtros: VentaWhereInput | undefined
  setFiltros: (filtros: VentaWhereInput) => void
  moraRango: MoraRango
  setMoraRango: (rango: MoraRango) => void
  estadoPago: EstadoPago
  setEstadoPago: (estado: EstadoPago) => void
}

export const useStoreFiltrosVentasPorCobrar = create<StoreFiltrosVentasPorCobrar>((set) => ({
  filtros: undefined,
  setFiltros: (filtros) => set({ filtros }),
  moraRango: 15,
  setMoraRango: (moraRango) => set({ moraRango }),
  estadoPago: 'pendientes',
  setEstadoPago: (estadoPago) => set({ estadoPago }),
}))
