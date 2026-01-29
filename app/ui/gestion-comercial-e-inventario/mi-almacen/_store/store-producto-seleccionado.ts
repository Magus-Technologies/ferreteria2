import { create } from 'zustand'
import type { Producto } from '~/app/_types/producto'

type UseStoreProductoSeleccionadoProps = {
  producto?: Producto
  setProducto: (value: Producto | undefined) => void
}

export const useStoreProductoSeleccionado =
  create<UseStoreProductoSeleccionadoProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
    }
  })
