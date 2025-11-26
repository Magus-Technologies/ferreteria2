import { create } from 'zustand'
import { FormCreateVenta } from '../_components/others/body-vender'
import { TipoMoneda } from '@prisma/client'

export type ValuesCardAgregarProductoVenta = Partial<
  FormCreateVenta['productos'][number]
>

type UseStoreProductoAgregadoVentaProps = {
  productoAgregado?: ValuesCardAgregarProductoVenta
  productos: ValuesCardAgregarProductoVenta[]
  tipo_moneda: TipoMoneda
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
  setTipoMoneda: (value: TipoMoneda) => void
}

export const useStoreProductoAgregadoVenta =
  create<UseStoreProductoAgregadoVentaProps>((set) => {
    return {
      productoAgregado: undefined,
      productos: [],
      tipo_moneda: TipoMoneda.Soles,
      setProductoAgregado: (value) => set({ productoAgregado: value }),
      setProductos: (value) =>
        set((state) => ({
          productos:
            typeof value === 'function' ? value(state.productos) : value ?? [],
        })),
      setTipoMoneda: (value) => set({ tipo_moneda: value }),
    }
  })
