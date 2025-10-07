import { create } from 'zustand'
import { TableProductosProps } from '../_components/tables/columns-productos'

type UseStoreProductoSeleccionadoSearchProps = {
  producto?: TableProductosProps
  setProducto: (value: TableProductosProps | undefined) => void
}

export const useStoreProductoSeleccionadoSearch =
  create<UseStoreProductoSeleccionadoSearchProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
    }
  })
