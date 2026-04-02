import { create } from 'zustand'
import { type OrdenCompra } from '~/lib/api/orden-compra'

interface StoreOrdenCompraSeleccionada {
  compra: OrdenCompra | undefined
  setCompra: (compra: OrdenCompra | undefined) => void
}

export const useStoreOrdenCompraSeleccionada =
  create<StoreOrdenCompraSeleccionada>(set => ({
    compra: undefined,
    setCompra: compra => set({ compra }),
  }))
