import { create } from 'zustand'
import { type Compra } from '~/lib/api/compra'

interface StoreOrdenCompraSeleccionada {
  compra: Compra | undefined
  setCompra: (compra: Compra | undefined) => void
}

export const useStoreOrdenCompraSeleccionada =
  create<StoreOrdenCompraSeleccionada>(set => ({
    compra: undefined,
    setCompra: compra => set({ compra }),
  }))
