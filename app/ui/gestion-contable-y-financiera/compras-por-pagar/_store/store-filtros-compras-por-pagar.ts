import { Prisma } from '@prisma/client'
import { create } from 'zustand'

interface StoreFiltrosComprasPorPagar {
  filtros: Prisma.CompraWhereInput | undefined
  setFiltros: (filtros: Prisma.CompraWhereInput) => void
}

export const useStoreFiltrosComprasPorPagar = create<StoreFiltrosComprasPorPagar>((set) => ({
  filtros: undefined,
  setFiltros: (filtros) => set({ filtros }),
}))