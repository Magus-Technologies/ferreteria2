import { create } from 'zustand'
import type { Producto } from '~/app/_types/producto'

type UseStoreProductoSeleccionadoSearchProps = {
  producto?: Producto
  setProducto: (value: Producto | undefined) => void
}

export const useStoreProductoSeleccionadoSearch =
  create<UseStoreProductoSeleccionadoSearchProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
    }
  })
