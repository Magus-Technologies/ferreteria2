import { create } from 'zustand'
import { getRecepcionesAlmacenResponseProps } from '~/app/_actions/recepcion-almacen'

type UseStoreRecepcionAlmacenSeleccionadaProps = {
  recepcionAlmacen?: getRecepcionesAlmacenResponseProps
  setRecepcionAlmacen: (
    value: getRecepcionesAlmacenResponseProps | undefined
  ) => void
}

export const useStoreRecepcionAlmacenSeleccionada =
  create<UseStoreRecepcionAlmacenSeleccionadaProps>(set => {
    return {
      recepcionAlmacen: undefined,
      setRecepcionAlmacen: value => set({ recepcionAlmacen: value }),
    }
  })
