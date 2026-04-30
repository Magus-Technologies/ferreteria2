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

// Defaults: hoy y 7 días atrás. Antes era "1 mes", lo que hacía que se
// mostraran prácticamente todas las entregas del mes y daba la sensación de
// que el filtro no funcionaba. 7 días es un rango más útil por defecto.
const filtrosIniciales: FiltrosMisEntregas = {
  fecha_desde: dayjs().subtract(7, 'days').startOf('day'),
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
