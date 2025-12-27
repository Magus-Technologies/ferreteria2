import { create } from 'zustand'
import type { FormCreatePrestamo } from '../_types/prestamo.types'
import { TipoMoneda, TipoOperacion, TipoEntidad } from '~/lib/api/prestamo'

type UseStoreProductoAgregadoPrestamo = {
  productoAgregado?: FormCreatePrestamo['productos'][number]
  setProductoAgregado: (
    producto: FormCreatePrestamo['productos'][number] | undefined
  ) => void
  tipo_moneda: TipoMoneda
  setTipoMoneda: (tipo_moneda: TipoMoneda) => void
  tipo_operacion: TipoOperacion
  setTipoOperacion: (tipo_operacion: TipoOperacion) => void
  tipo_entidad: TipoEntidad
  setTipoEntidad: (tipo_entidad: TipoEntidad) => void
}

export const useStoreProductoAgregadoPrestamo =
  create<UseStoreProductoAgregadoPrestamo>((set) => ({
    productoAgregado: undefined,
    setProductoAgregado: (producto) => set({ productoAgregado: producto }),
    tipo_moneda: TipoMoneda.SOLES,
    setTipoMoneda: (tipo_moneda) => set({ tipo_moneda }),
    tipo_operacion: TipoOperacion.PRESTAR,
    setTipoOperacion: (tipo_operacion) => set({ tipo_operacion }),
    tipo_entidad: TipoEntidad.CLIENTE,
    setTipoEntidad: (tipo_entidad) => set({ tipo_entidad }),
  }))
