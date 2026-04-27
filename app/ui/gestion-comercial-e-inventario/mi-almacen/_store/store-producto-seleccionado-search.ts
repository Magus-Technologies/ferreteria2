import { create } from 'zustand'
import type { Producto } from '~/app/_types/producto'

type UseStoreProductoSeleccionadoSearchProps = {
  producto?: Producto
  setProducto: (value: Producto | undefined) => void
  searchText: string
  setSearchText: (value: string) => void
  // Contador que se incrementa cuando el usuario confirma una selección
  // (Enter en buscador o click en fila). La card de agregar producto lo
  // observa para mover el focus a "Cantidad" — independiente del auto-select.
  confirmCount: number
  requestConfirm: () => void
}

export const useStoreProductoSeleccionadoSearch =
  create<UseStoreProductoSeleccionadoSearchProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
      searchText: '',
      setSearchText: value => set({ searchText: value }),
      confirmCount: 0,
      requestConfirm: () => set(s => ({ confirmCount: s.confirmCount + 1 })),
    }
  })
