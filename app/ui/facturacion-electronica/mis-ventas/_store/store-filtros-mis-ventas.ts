import { Prisma } from '@prisma/client'
import { create } from 'zustand'

type UseStoreFiltrosMisVentasProps = {
  filtros?: Prisma.VentaWhereInput
  setFiltros: (filtros: Prisma.VentaWhereInput) => void
}

export const useStoreFiltrosMisVentas =
  create<UseStoreFiltrosMisVentasProps>(set => {
    return {
      filtros: undefined,
      setFiltros: filtros => set({ filtros }),
    }
  })
