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

// La tabla no tiene paginador: lo que no entra en `per_page` sencillamente no se
// ve, y con 50 un vendedor con 63 ventas mostraba 13 menos sin avisar de nada.
// El backend acepta hasta 10.000 (GananciasController), así que se pide el máximo
// y el filtrado por fechas es lo que acota el volumen real.
const filtrosIniciales: FiltrosGanancias = {
  per_page: 10000,
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