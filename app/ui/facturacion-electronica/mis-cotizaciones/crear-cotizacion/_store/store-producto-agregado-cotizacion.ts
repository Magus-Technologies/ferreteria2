import { create } from 'zustand'
import type { FormCreateCotizacion, TipoMoneda } from '../_types/cotizacion.types'
import type { Producto } from '~/app/_types/producto'

// Extender el tipo de producto para incluir unidades derivadas disponibles
export type ProductoCotizacionConUnidades = FormCreateCotizacion['productos'][number] & {
  unidades_derivadas_disponibles?: Producto['producto_en_almacenes'][number]['unidades_derivadas']
}

type UseStoreProductoAgregadoCotizacion = {
  productoAgregado?: ProductoCotizacionConUnidades
  // Catálogo de productos distintos ya agregados — SOLO guarda
  // `unidades_derivadas_disponibles` por producto_id para los selects
  // (SelectUnidadDerivadaCotizacion, SelectTipoPrecioCotizacion). NO son las
  // filas de la tabla (ver `carrito`).
  productos: ProductoCotizacionConUnidades[]
  // Filas reales de la tabla de cotización, identificadas por `_row_id`.
  // Reemplaza a Form.List — mismo motivo de performance que crear-venta
  // (ver nota en table-vender.tsx).
  carrito: ProductoCotizacionConUnidades[]
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
  setCarrito: (
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
    carrito: [],
    setProductoAgregado: (producto) => set({ productoAgregado: producto }),
    setProductos: (value) =>
      set((state) => ({
        productos:
          typeof value === 'function' ? value(state.productos) : value ?? [],
      })),
    setCarrito: (value) =>
      set((state) => ({
        carrito:
          typeof value === 'function' ? value(state.carrito) : value ?? [],
      })),
    tipo_moneda: 's',
    setTipoMoneda: (tipo_moneda) => set({ tipo_moneda }),
  }))
