import { create } from 'zustand'
import { TipoMoneda } from '@prisma/client'
import { FormCreateCotizacion } from '../_components/others/body-cotizar'

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
    tipo_moneda: TipoMoneda.Soles,
    setTipoMoneda: (tipo_moneda) => set({ tipo_moneda }),
  }))
