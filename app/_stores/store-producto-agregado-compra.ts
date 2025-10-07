import { create } from 'zustand'
import { ValuesCardAgregarProductoCompra } from '../ui/gestion-comercial-e-inventario/mis-compras/crear-compra/_components/cards/card-agregar-producto-compra'

type UseStoreProductoAgregadoCompraProps = {
  productoAgregado?: ValuesCardAgregarProductoCompra
  productos: ValuesCardAgregarProductoCompra[]
  setProductoAgregado: (
    value: ValuesCardAgregarProductoCompra | undefined
  ) => void
  setProductos: (
    value:
      | ValuesCardAgregarProductoCompra[]
      | undefined
      | ((
          prev: ValuesCardAgregarProductoCompra[]
        ) => ValuesCardAgregarProductoCompra[])
  ) => void
}

export const useStoreProductoAgregadoCompra =
  create<UseStoreProductoAgregadoCompraProps>(set => {
    return {
      productoAgregado: undefined,
      productos: [],
      setProductoAgregado: value => set({ productoAgregado: value }),
      setProductos: value =>
        set(state => ({
          productos:
            typeof value === 'function' ? value(state.productos) : value ?? [],
        })),
    }
  })
