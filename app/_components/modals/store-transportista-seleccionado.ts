import { create } from 'zustand'
import { Transportista } from '~/lib/api/transportista'

type UseStoreTransportistaSeleccionado = {
  transportista?: Transportista
  setTransportista: (transportista: Transportista | undefined) => void
}

export const useStoreTransportistaSeleccionado =
  create<UseStoreTransportistaSeleccionado>(set => ({
    transportista: undefined,
    setTransportista: transportista => set({ transportista }),
  }))
