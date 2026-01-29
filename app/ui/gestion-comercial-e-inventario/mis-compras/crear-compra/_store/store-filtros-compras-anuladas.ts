import { create } from 'zustand'
import { Prisma } from '@prisma/client'

type UseStoreFiltrosComprasAnuladasProps = {
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

export const useStoreFiltrosComprasAnuladas =
  create<UseStoreFiltrosComprasAnuladasProps>(set => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  })
