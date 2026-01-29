import { create } from 'zustand'
import { Prisma } from '@prisma/client'

type UseStoreFiltrosComprasEnEsperaProps = {
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

export const useStoreFiltrosComprasEnEspera =
  create<UseStoreFiltrosComprasEnEsperaProps>(set => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  })
