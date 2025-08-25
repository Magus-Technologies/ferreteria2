import { create } from 'zustand'
import { Prisma } from '@prisma/client'

type UseStoreFiltrosProductosProps = {
  filtros?: Prisma.ProductoWhereInput
  setFiltros: (value: Prisma.ProductoWhereInput | undefined) => void
}

export const useStoreFiltrosProductos = create<UseStoreFiltrosProductosProps>(
  set => {
    return {
      filtros: undefined,
      setFiltros: value => set({ filtros: value }),
    }
  }
)
