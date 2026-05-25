import { create } from 'zustand'
import type { ResumenVenta } from '~/lib/api/entregas'

interface StoreVentaSeleccionada {
  venta: ResumenVenta | undefined
  setVenta: (venta: ResumenVenta | undefined) => void
}

export const useStoreVentaSeleccionada = create<StoreVentaSeleccionada>((set) => ({
  venta: undefined,
  setVenta: (venta) => set({ venta }),
}))
