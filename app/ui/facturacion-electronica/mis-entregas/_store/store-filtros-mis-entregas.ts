import { create } from 'zustand'
import dayjs, { Dayjs } from 'dayjs'

export interface FiltrosMisEntregas {
  fecha_desde: Dayjs
  fecha_hasta: Dayjs
  estado_entrega?: 'PENDIENTE' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO'
  tipo_despacho?: 'INMEDIATO' | 'PROGRAMADO'
  search?: string
}

interface StoreFiltrosMisEntregas {
  filtros: FiltrosMisEntregas
  setFiltros: (filtros: Partial<FiltrosMisEntregas>) => void
  resetFiltros: () => void
}

const filtrosIniciales: FiltrosMisEntregas = {
  fecha_desde: dayjs().startOf('month'),
  fecha_hasta: dayjs().endOf('month'),
}

export const useStoreFiltrosMisEntregas = create<StoreFiltrosMisEntregas>((set) => ({
  filtros: filtrosIniciales,
  setFiltros: (nuevosFiltros) =>
    set((state) => ({
      filtros: { ...state.filtros, ...nuevosFiltros },
    })),
  resetFiltros: () => set({ filtros: filtrosIniciales }),
}))
