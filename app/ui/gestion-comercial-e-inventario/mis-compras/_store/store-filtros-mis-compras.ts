import { create } from 'zustand'
import { Prisma } from '@prisma/client'

type UseStoreFiltrosMisComprasProps = {
  filtros?: Prisma.CompraWhereInput
  setFiltros: (
    value:
      | Prisma.CompraWhereInput
      | undefined
      | ((
          prev?: Prisma.CompraWhereInput
        ) => Prisma.CompraWhereInput | undefined)
  ) => void
}

export const useStoreFiltrosMisCompras = create<UseStoreFiltrosMisComprasProps>(
  set => {
    return {
      filtros: {}, // Inicializar con objeto vacío en lugar de undefined
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  }
)
