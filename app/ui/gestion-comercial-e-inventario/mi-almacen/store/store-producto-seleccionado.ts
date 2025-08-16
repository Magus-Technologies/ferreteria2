import { create } from 'zustand'
import { TableProductosProps } from '../_components/tables/columns-productos'

type UseStoreProductoSeleccionadoProps = {
  producto?: TableProductosProps
  setProducto: (value: TableProductosProps | undefined) => void
}

export const useStoreProductoSeleccionado =
  create<UseStoreProductoSeleccionadoProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
    }
  })
