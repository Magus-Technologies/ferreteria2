import { create } from 'zustand'
import dayjs, { Dayjs } from 'dayjs'

export interface FiltrosMisEntregas {
  fecha_desde: Dayjs
  fecha_hasta: Dayjs
  estado_entrega?: string[]
  tipo_despacho?: 'in' | 'pr'
  tipo_entrega?: 'rt' | 'de' | 'pa'
  search?: string
}

interface StoreFiltrosMisEntregas {
  filtros: FiltrosMisEntregas
  setFiltros: (filtros: FiltrosMisEntregas) => void
  resetFiltros: () => void
}

// Defaults: solo HOY (igual que mis-ventas). Antes había un rango de varios
// días que daba la sensación de que el filtro no funcionaba (mostraba todo).
const filtrosIniciales: FiltrosMisEntregas = {
  fecha_desde: dayjs().startOf('day'),
  fecha_hasta: dayjs().endOf('day'),
}

export const useStoreFiltrosMisEntregas = create<StoreFiltrosMisEntregas>((set) => ({
  filtros: filtrosIniciales,
  setFiltros: (nuevosFiltros) =>
    set(() => ({
      filtros: nuevosFiltros,
    })),
  resetFiltros: () => set({ filtros: filtrosIniciales }),
}))
