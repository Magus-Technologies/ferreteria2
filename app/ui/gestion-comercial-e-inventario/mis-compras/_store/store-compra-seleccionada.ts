import { create } from 'zustand'
import { type Compra } from '~/lib/api/compra'

type UseStoreCompraSeleccionadaProps = {
  compra?: Compra
  setCompra: (value: Compra | undefined) => void
}

export const useStoreCompraSeleccionada =
  create<UseStoreCompraSeleccionadaProps>(set => {
    return {
      compra: undefined,
      setCompra: value => set({ compra: value }),
    }
  })
