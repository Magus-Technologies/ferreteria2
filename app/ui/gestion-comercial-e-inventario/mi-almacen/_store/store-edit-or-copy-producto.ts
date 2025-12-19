import { create } from 'zustand'
import type { Producto } from '~/app/_types/producto'

export type productoEditOrCopy = Omit<
  Producto,
  'id' | 'cod_producto' | 'cod_barra'
> & {
  id?: number
  cod_producto?: string
  cod_barra?: string
}

type UseStoreEditOrCopyProductoProps = {
  producto?: productoEditOrCopy
  setProducto: (value: productoEditOrCopy | undefined) => void
  openModal: boolean
  setOpenModal: (value: boolean) => void
}

export const useStoreEditOrCopyProducto =
  create<UseStoreEditOrCopyProductoProps>(set => {
    return {
      producto: undefined,
      setProducto: value => set({ producto: value }),
      openModal: false,
      setOpenModal: value => set({ openModal: value }),
    }
  })
