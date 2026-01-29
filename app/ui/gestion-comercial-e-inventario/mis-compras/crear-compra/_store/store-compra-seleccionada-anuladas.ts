import { create } from 'zustand'
import { type Compra } from '~/lib/api/compra'

type UseStoreCompraSeleccionadaAnuladasProps = {
  compra?: Compra
  setCompra: (value: Compra | undefined) => void
}

export const useStoreCompraSeleccionadaAnuladas =
  create<UseStoreCompraSeleccionadaAnuladasProps>(set => {
    return {
      compra: undefined,
      setCompra: value => set({ compra: value }),
    }
  })
