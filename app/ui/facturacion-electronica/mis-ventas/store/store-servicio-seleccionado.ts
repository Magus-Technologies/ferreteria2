import { create } from 'zustand'
import type { Servicio } from '~/lib/api/servicios'

type UseStoreServicioSeleccionadoProps = {
  servicio?: Servicio
  setServicio: (value: Servicio | undefined) => void
}

export const useStoreServicioSeleccionado =
  create<UseStoreServicioSeleccionadoProps>(set => {
    return {
      servicio: undefined,
      setServicio: value => set({ servicio: value }),
    }
  })
