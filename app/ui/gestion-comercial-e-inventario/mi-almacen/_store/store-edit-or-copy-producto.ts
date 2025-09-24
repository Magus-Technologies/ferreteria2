import { create } from 'zustand'
import { TableProductosProps } from '../_components/tables/columns-productos'

export type productoEditOrCopy = Omit<
  TableProductosProps,
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
