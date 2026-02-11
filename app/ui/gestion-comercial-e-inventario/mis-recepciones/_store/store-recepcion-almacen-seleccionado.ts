import { create } from 'zustand'
import type { RecepcionAlmacenResponse } from '~/lib/api/recepcion-almacen'

type UseStoreRecepcionAlmacenSeleccionadaProps = {
  recepcionAlmacen?: RecepcionAlmacenResponse
  setRecepcionAlmacen: (
    value: RecepcionAlmacenResponse | undefined
  ) => void
}

export const useStoreRecepcionAlmacenSeleccionada =
  create<UseStoreRecepcionAlmacenSeleccionadaProps>(set => {
    return {
      recepcionAlmacen: undefined,
      setRecepcionAlmacen: value => set({ recepcionAlmacen: value }),
    }
  })
