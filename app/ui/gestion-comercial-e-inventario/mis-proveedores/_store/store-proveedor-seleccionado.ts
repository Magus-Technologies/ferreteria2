import { create } from 'zustand'

interface StoreProveedorSeleccionado {
  proveedorId: number | null
  setProveedorId: (id: number | null) => void
}

export const useStoreProveedorSeleccionado = create<StoreProveedorSeleccionado>((set) => ({
  proveedorId: null,
  setProveedorId: (id: number | null) => set({ proveedorId: id }),
}))
