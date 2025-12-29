import { create } from 'zustand'
import { type Compra } from '~/lib/api/compra'

type UseStoreCompraSeleccionadaEnEsperaProps = {
  compra?: Compra
  setCompra: (value: Compra | undefined) => void
}

export const useStoreCompraSeleccionadaEnEspera =
  create<UseStoreCompraSeleccionadaEnEsperaProps>(set => {
    return {
      compra: undefined,
      setCompra: value => set({ compra: value }),
    }
  })
