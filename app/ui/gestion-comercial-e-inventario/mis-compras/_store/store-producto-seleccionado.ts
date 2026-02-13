import { create } from 'zustand'
import { type UnidadDerivadaInmutableCompra } from '~/lib/api/compra'

type UseStoreProductoSeleccionadoProps = {
  productoSeleccionado?: UnidadDerivadaInmutableCompra & { producto_almacen_id?: number }
  setProductoSeleccionado: (value: (UnidadDerivadaInmutableCompra & { producto_almacen_id?: number }) | undefined) => void
}

export const useStoreProductoSeleccionado =
  create<UseStoreProductoSeleccionadoProps>(set => {
    return {
      productoSeleccionado: undefined,
      setProductoSeleccionado: value => set({ productoSeleccionado: value }),
    }
  })
