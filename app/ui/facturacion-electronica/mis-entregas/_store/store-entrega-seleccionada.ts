import { create } from 'zustand'
import type { EntregaNueva } from '~/lib/api/entregas'

interface StoreEntregaSeleccionada {
  entrega: EntregaNueva | undefined
  setEntrega: (entrega: EntregaNueva | undefined) => void
}

export const useStoreEntregaSeleccionada = create<StoreEntregaSeleccionada>((set) => ({
  entrega: undefined,
  setEntrega: (entrega) => set({ entrega }),
}))
