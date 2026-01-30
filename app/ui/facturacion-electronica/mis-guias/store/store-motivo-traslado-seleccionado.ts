import { create } from 'zustand'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'

type UseStoreMotivoTrasladoSeleccionadoProps = {
  motivoTraslado?: MotivoTraslado
  setMotivoTraslado: (value: MotivoTraslado | undefined) => void
}

export const useStoreMotivoTrasladoSeleccionado =
  create<UseStoreMotivoTrasladoSeleccionadoProps>(set => {
    return {
      motivoTraslado: undefined,
      setMotivoTraslado: value => set({ motivoTraslado: value }),
    }
  })
