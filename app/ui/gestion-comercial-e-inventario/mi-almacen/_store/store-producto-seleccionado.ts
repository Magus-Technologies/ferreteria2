import { create } from 'zustand'
import { getProductosResponseProps } from '~/app/_actions/producto'

type UseStoreProductoSeleccionadoProps = {
  producto?: getProductosResponseProps
  setProducto: (value: getProductosResponseProps | undefined) => void
}

export const useStoreProductoSeleccionado =
  create<UseStoreProductoSeleccionadoProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
    }
  })
