import { create } from 'zustand'

interface Usuario {
  id: string
  name: string
  numero_documento: string
  rol_sistema: string
}

interface StoreDespachadorSeleccionado {
  despachador: Usuario | undefined
  setDespachador: (despachador: Usuario | undefined) => void
}

export const useStoreDespachadorSeleccionado = create<StoreDespachadorSeleccionado>((set) => ({
  despachador: undefined,
  setDespachador: (despachador) => set({ despachador }),
}))
