import { create } from 'zustand'
import dayjs, { Dayjs } from 'dayjs'
import type { TipoDespacho, TipoEntrega } from '~/lib/api/entrega-producto'

export interface FiltrosMisEntregas {
  // Las fechas son opcionales: si el usuario las borra, no se filtra por
  // fecha (mismo comportamiento que mis-ventas). Antes eran requeridas y
  // hacían fallback a hoy, lo que confundía porque parecía que el filtro
  // ignoraba lo que el usuario quería.
  fecha_desde?: Dayjs
  fecha_hasta?: Dayjs
  estado_entrega?: string[]
  // Antes los tipos eran literales ('in' | 'pr'). El api los pide como enum
  // TipoDespacho/TipoEntrega y TS no asigna literales a enums aunque tengan
  // el mismo valor → usar los enums directamente.
  tipo_despacho?: TipoDespacho
  tipo_entrega?: TipoEntrega
  search?: string
  /** true: solo ventas sin ninguna entrega asignada (domicilio omitidas, etc.) */
  solo_sin_entregas?: boolean
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
