import type { CompraWhereInput } from '~/types'
import { create } from 'zustand'

interface StoreFiltrosComprasPorPagar {
  filtros: CompraWhereInput | undefined
  setFiltros: (filtros: CompraWhereInput) => void
}

export const useStoreFiltrosComprasPorPagar = create<StoreFiltrosComprasPorPagar>((set) => ({
  filtros: undefined,
  setFiltros: (filtros) => set({ filtros }),
}))