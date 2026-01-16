import { create } from 'zustand'
import type { Paquete } from '~/lib/api/paquete'

type UseStorePaqueteSeleccionadoProps = {
  paquete?: Paquete
  setPaquete: (value: Paquete | undefined) => void
}

export const useStorePaqueteSeleccionado =
  create<UseStorePaqueteSeleccionadoProps>(set => {
    return {
      paquete: undefined,
      setPaquete: value => set({ paquete: value }),
    }
  })

