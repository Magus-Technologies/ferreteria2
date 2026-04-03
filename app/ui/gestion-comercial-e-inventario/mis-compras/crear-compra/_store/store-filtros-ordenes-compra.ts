import { create } from 'zustand'
import { type OrdenCompraFilters } from '~/lib/api/orden-compra'
import dayjs from 'dayjs'

interface StoreFiltrosOrdenesCompra {
  filtros: OrdenCompraFilters
  setFiltros: (filtros: OrdenCompraFilters) => void
}

export const useStoreFiltrosOrdenesCompra = create<StoreFiltrosOrdenesCompra>(
  set => ({
    filtros: {
      estado: 'pendiente', // Solo pendientes por defecto
      desde: dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
      hasta: dayjs().format('YYYY-MM-DD'),
    },
    setFiltros: filtros => set({ filtros }),
  })
)
