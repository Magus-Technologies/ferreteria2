import { Prisma } from '@prisma/client'
import { create } from 'zustand'

interface StoreFiltrosVentasPorCobrar {
  filtros: Prisma.VentaWhereInput | undefined
  setFiltros: (filtros: Prisma.VentaWhereInput) => void
}

export const useStoreFiltrosVentasPorCobrar = create<StoreFiltrosVentasPorCobrar>((set) => ({
  filtros: undefined,
  setFiltros: (filtros) => set({ filtros }),
}))
