import { create } from 'zustand'
import type { FormCreateCotizacion, TipoMoneda } from '../_types/cotizacion.types'
import { getProductosResponseProps } from '~/app/_actions/producto'

// Extender el tipo de producto para incluir unidades derivadas disponibles
export type ProductoCotizacionConUnidades = FormCreateCotizacion['productos'][number] & {
  unidades_derivadas_disponibles?: getProductosResponseProps['producto_en_almacenes'][number]['unidades_derivadas']
}

type UseStoreProductoAgregadoCotizacion = {
  productoAgregado?: ProductoCotizacionConUnidades
  productos: ProductoCotizacionConUnidades[]
  setProductoAgregado: (
    producto: ProductoCotizacionConUnidades | undefined
  ) => void
  setProductos: (
    value:
      | ProductoCotizacionConUnidades[]
      | undefined
      | ((
          prev: ProductoCotizacionConUnidades[]
        ) => ProductoCotizacionConUnidades[])
  ) => void
  tipo_moneda: TipoMoneda
  setTipoMoneda: (tipo_moneda: TipoMoneda) => void
}

export const useStoreProductoAgregadoCotizacion =
  create<UseStoreProductoAgregadoCotizacion>((set) => ({
    productoAgregado: undefined,
    productos: [],
    setProductoAgregado: (producto) => set({ productoAgregado: producto }),
    setProductos: (value) =>
      set((state) => ({
        productos:
          typeof value === 'function' ? value(state.productos) : value ?? [],
      })),
    tipo_moneda: 's',
    setTipoMoneda: (tipo_moneda) => set({ tipo_moneda }),
  }))
