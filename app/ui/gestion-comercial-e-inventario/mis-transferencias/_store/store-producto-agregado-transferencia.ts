import { create } from 'zustand'

export type ValuesCardAgregarProductoTransferencia = {
  producto_id?: number
  producto_name?: string
  cod_producto?: string
  unidad_derivada_id?: number
  unidad_derivada_name?: string
  unidad_derivada_factor?: number
  cantidad?: number
  stock_fraccion?: number
  unidades_contenidas?: number
  unidades_derivadas_disponibles?: any[]
}

type UseStoreProductoAgregadoTransferenciaProps = {
  productoAgregado?: ValuesCardAgregarProductoTransferencia
  setProductoAgregado: (
    value: ValuesCardAgregarProductoTransferencia | undefined
  ) => void
}

export const useStoreProductoAgregadoTransferencia =
  create<UseStoreProductoAgregadoTransferenciaProps>((set) => ({
    productoAgregado: undefined,
    setProductoAgregado: (value) => set({ productoAgregado: value }),
  }))
