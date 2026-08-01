'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { FiltrosGanancias } from '~/lib/api/ganancias'

interface FechasUI {
  desde?: string
  hasta?: string
}

interface StoreFiltrosMisGanancias {
  filtros: FiltrosGanancias
  setFiltros: (filtros: FiltrosGanancias) => void
  limpiarFiltros: () => void
  // Fechas "en vivo" del formulario de filtros (el valor actual de los inputs,
  // aún SIN aplicar con "Buscar"). El modal de Análisis de Pérdidas las usa para
  // abrir con la MISMA fecha que se ve en el filtro principal, sin obligar a dar
  // Buscar y sin recargar la tabla principal (que depende de `filtros`, no de esto).
  fechasUI: FechasUI
  setFechasUI: (fechas: FechasUI) => void
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
      fechasUI: {},
      setFechasUI: (fechasUI: FechasUI) => set({ fechasUI }),
    }),
    {
      name: 'store-filtros-mis-ganancias',
    }
  )
)