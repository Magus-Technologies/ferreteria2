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
      desde: dayjs().format('YYYY-MM-DD'), // Hoy por defecto (coincide con el filtro)
      hasta: dayjs().format('YYYY-MM-DD'),
    },
    setFiltros: filtros => set({ filtros }),
  })
)
