import { create } from 'zustand'
import { FormCreateVenta } from '../_components/others/body-vender'
import { TipoMoneda } from '~/lib/api/venta'
import type { Producto } from '~/app/_types/producto'

export type ValuesCardAgregarProductoVenta = Partial<
  FormCreateVenta['productos'][number]
> & {
  // Agregar las unidades derivadas disponibles del producto
  unidades_derivadas_disponibles?: Producto['producto_en_almacenes'][number]['unidades_derivadas']
}

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
      tipo_moneda: TipoMoneda.SOLES,
      setProductoAgregado: (value) => set({ productoAgregado: value }),
      setProductos: (value) =>
        set((state) => ({
          productos:
            typeof value === 'function' ? value(state.productos) : value ?? [],
        })),
      setTipoMoneda: (value) => set({ tipo_moneda: value }),
    }
  })
