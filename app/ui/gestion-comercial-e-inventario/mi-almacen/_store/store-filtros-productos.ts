import { create } from 'zustand'
import { Prisma } from '@prisma/client'

type UseStoreFiltrosProductosProps = {
  filtros?: Prisma.ProductoWhereInput
  setFiltros: (
    value:
      | Prisma.ProductoWhereInput
      | undefined
      | ((
          prev?: Prisma.ProductoWhereInput
        ) => Prisma.ProductoWhereInput | undefined)
  ) => void
}

export const useStoreFiltrosProductos = create<UseStoreFiltrosProductosProps>(
  set => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  }
)
