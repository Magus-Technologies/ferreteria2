import { create } from 'zustand'
import { getPeriodoComisiones } from '~/app/_lib/periodo-comisiones'

export interface FiltrosComisiones {
  desde: string
  hasta: string
  almacen_id?: number
  user_id?: string
}

interface Store {
  filtros: FiltrosComisiones
  setFiltros: (filtros: Partial<FiltrosComisiones>) => void
  reset: () => void
}

// Antes arrancaba en hoy..hoy, así que la pantalla salía casi siempre vacía:
// las comisiones se liquidan por mes, no por día.
const getDefault = (): FiltrosComisiones => getPeriodoComisiones()

export const useStoreFiltrosComisiones = create<Store>((set) => ({
  filtros: getDefault(),
  setFiltros: (filtros) =>
    set((state) => ({ filtros: { ...state.filtros, ...filtros } })),
  reset: () => set({ filtros: getDefault() }),
}))
