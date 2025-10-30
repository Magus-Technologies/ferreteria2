import { create } from 'zustand'
import { getProductosResponseProps } from '~/app/_actions/producto'

type UseStoreProductoSeleccionadoSearchProps = {
  producto?: getProductosResponseProps
  setProducto: (value: getProductosResponseProps | undefined) => void
}

export const useStoreProductoSeleccionadoSearch =
  create<UseStoreProductoSeleccionadoSearchProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
    }
  })
