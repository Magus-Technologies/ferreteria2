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
  (set, get) => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => {
          const newValue = typeof value === 'function' ? value(state.filtros) : value
          // Evitar actualizaciones innecesarias si el valor es el mismo
          if (JSON.stringify(newValue) === JSON.stringify(state.filtros)) {
            return state
          }
          return { filtros: newValue }
        }),
    }
  }
)
