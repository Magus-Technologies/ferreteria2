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

const filtrosIniciales: FiltrosMisEntregas = {
  fecha_desde: dayjs().subtract(30, 'days').startOf('day'),
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
