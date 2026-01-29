import { create } from 'zustand'
import { Prisma } from '@prisma/client'

type UseStoreFiltrosMisRecepcionesProps = {
  filtros?: Prisma.RecepcionAlmacenWhereInput
  setFiltros: (
    value:
      | Prisma.RecepcionAlmacenWhereInput
      | undefined
      | ((
          prev?: Prisma.RecepcionAlmacenWhereInput
        ) => Prisma.RecepcionAlmacenWhereInput | undefined)
  ) => void
}

export const useStoreFiltrosMisRecepciones =
  create<UseStoreFiltrosMisRecepcionesProps>(set => {
    return {
      filtros: undefined,
      setFiltros: value =>
        set(state => ({
          filtros: typeof value === 'function' ? value(state.filtros) : value,
        })),
    }
  })
