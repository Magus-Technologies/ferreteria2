import { create } from 'zustand'
import { FormCreateVenta } from '../_components/others/body-vender'

export type ValuesCardAgregarProductoVenta = Partial<
  FormCreateVenta['productos'][number]
>

type UseStoreProductoAgregadoVentaProps = {
  productoAgregado?: ValuesCardAgregarProductoVenta
  productos: ValuesCardAgregarProductoVenta[]
  setProductoAgregado: (
    value: ValuesCardAgregarProductoVenta | undefined
  ) => void
  setProductos: (
    value:
      | ValuesCardAgregarProductoVenta[]
      | undefined
      | ((
          prev: ValuesCardAgregarProductoVenta[]
        ) => ValuesCardAgregarProductoVenta[])
  ) => void
}

export const useStoreProductoAgregadoVenta =
  create<UseStoreProductoAgregadoVentaProps>((set) => {
    return {
      productoAgregado: undefined,
      productos: [],
      setProductoAgregado: (value) => set({ productoAgregado: value }),
      setProductos: (value) =>
        set((state) => ({
          productos:
            typeof value === 'function' ? value(state.productos) : value ?? [],
        })),
    }
  })
