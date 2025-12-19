import { create } from 'zustand'
import type { FormCreateCotizacion, TipoMoneda } from '../_types/cotizacion.types'

type UseStoreProductoAgregadoCotizacion = {
  productoAgregado?: FormCreateCotizacion['productos'][number]
  setProductoAgregado: (
    producto: FormCreateCotizacion['productos'][number] | undefined
  ) => void
  tipo_moneda: TipoMoneda
  setTipoMoneda: (tipo_moneda: TipoMoneda) => void
}

export const useStoreProductoAgregadoCotizacion =
  create<UseStoreProductoAgregadoCotizacion>((set) => ({
    productoAgregado: undefined,
    setProductoAgregado: (producto) => set({ productoAgregado: producto }),
    tipo_moneda: 's',
    setTipoMoneda: (tipo_moneda) => set({ tipo_moneda }),
  }))
