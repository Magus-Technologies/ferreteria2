import { create } from 'zustand'
import dayjs from 'dayjs'

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

const getDefault = (): FiltrosComisiones => ({
  desde: dayjs().format('YYYY-MM-DD'),
  hasta: dayjs().format('YYYY-MM-DD'),
})

export const useStoreFiltrosComisiones = create<Store>((set) => ({
  filtros: getDefault(),
  setFiltros: (filtros) =>
    set((state) => ({ filtros: { ...state.filtros, ...filtros } })),
  reset: () => set({ filtros: getDefault() }),
}))
