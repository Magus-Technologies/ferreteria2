import { create } from 'zustand'
import dayjs, { Dayjs } from 'dayjs'

export interface FiltrosMisEntregas {
  fecha_desde: Dayjs
  fecha_hasta: Dayjs
  estado_entrega?: string[]
  tipo_despacho?: 'INMEDIATO' | 'PROGRAMADO'
  search?: string
}

interface StoreFiltrosMisEntregas {
  filtros: FiltrosMisEntregas
  setFiltros: (filtros: FiltrosMisEntregas) => void
  resetFiltros: () => void
}

const filtrosIniciales: FiltrosMisEntregas = {
  fecha_desde: dayjs().startOf('month'),
  fecha_hasta: dayjs().endOf('month'),
  estado_entrega: ['pe', 'ec'],
}

export const useStoreFiltrosMisEntregas = create<StoreFiltrosMisEntregas>((set) => ({
  filtros: filtrosIniciales,
  setFiltros: (nuevosFiltros) =>
    set(() => ({
      filtros: nuevosFiltros,
    })),
  resetFiltros: () => set({ filtros: filtrosIniciales }),
}))
