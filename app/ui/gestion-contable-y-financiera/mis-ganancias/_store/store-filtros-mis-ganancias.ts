'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { FiltrosGanancias } from '~/lib/api/ganancias'

interface StoreFiltrosMisGanancias {
  filtros: FiltrosGanancias
  setFiltros: (filtros: FiltrosGanancias) => void
  limpiarFiltros: () => void
}

const filtrosIniciales: FiltrosGanancias = {
  per_page: 50,
  page: 1,
}

export const useStoreFiltrosMisGanancias = create<StoreFiltrosMisGanancias>()(
  devtools(
    (set) => ({
      filtros: filtrosIniciales,
      setFiltros: (filtros: FiltrosGanancias) => set({ filtros }),
      limpiarFiltros: () => set({ filtros: filtrosIniciales }),
    }),
    {
      name: 'store-filtros-mis-ganancias',
    }
  )
)