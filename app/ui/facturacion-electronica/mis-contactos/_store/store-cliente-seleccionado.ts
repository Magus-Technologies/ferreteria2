import { create } from 'zustand'

interface StoreClienteSeleccionado {
  clienteId: number | null
  setClienteId: (id: number | null) => void
}

export const useStoreClienteSeleccionado = create<StoreClienteSeleccionado>((set) => ({
  clienteId: null,
  setClienteId: (id: number | null) => set({ clienteId: id }),
}))
