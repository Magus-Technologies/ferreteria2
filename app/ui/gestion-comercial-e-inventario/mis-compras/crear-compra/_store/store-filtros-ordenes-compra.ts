import { create } from 'zustand'
import { Prisma, EstadoDeCompra } from '@prisma/client'
import dayjs from 'dayjs'
import { toUTCBD } from '~/utils/fechas'

interface StoreFiltrosOrdenesCompra {
  filtros: Prisma.CompraWhereInput
  setFiltros: (filtros: Prisma.CompraWhereInput) => void
}

export const useStoreFiltrosOrdenesCompra = create<StoreFiltrosOrdenesCompra>(
  set => ({
    filtros: {
      estado_de_compra: {
        in: [EstadoDeCompra.Creado, EstadoDeCompra.Procesado],
      },
      fecha: {
        gte: toUTCBD({ date: dayjs().subtract(30, 'days').startOf('day') }),
        lte: toUTCBD({ date: dayjs().endOf('day') }),
      },
    },
    setFiltros: filtros => set({ filtros }),
  })
)
