import { create } from 'zustand'
import { FormCreateGuia } from '../_components/others/body-crear-guia'

export type ValuesCardAgregarProductoGuia = Partial<
  FormCreateGuia['productos'][number]
>

type UseStoreProductoAgregadoGuiaProps = {
  productoAgregado?: ValuesCardAgregarProductoGuia
  productos: ValuesCardAgregarProductoGuia[]
  setProductoAgregado: (
    value: ValuesCardAgregarProductoGuia | undefined
  ) => void
  setProductos: (
    value:
      | ValuesCardAgregarProductoGuia[]
      | undefined
      | ((
          prev: ValuesCardAgregarProductoGuia[]
        ) => ValuesCardAgregarProductoGuia[])
  ) => void
}

export const useStoreProductoAgregadoGuia =
  create<UseStoreProductoAgregadoGuiaProps>((set) => {
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
