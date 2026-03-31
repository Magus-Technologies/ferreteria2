import { create } from 'zustand'
import { EstadoDeCompra, type CompraWhereInput } from '~/types'
import dayjs from 'dayjs'
import { toUTCBD } from '~/utils/fechas'

interface StoreFiltrosOrdenesCompra {
  filtros: CompraWhereInput
  setFiltros: (filtros: CompraWhereInput) => void
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
      // FILTRO CRÍTICO: Solo mostrar compras que vengan de una orden de compra
      orden_compra_id: {
        not: null,
      },
    },
    setFiltros: filtros => set({ filtros }),
  })
)
