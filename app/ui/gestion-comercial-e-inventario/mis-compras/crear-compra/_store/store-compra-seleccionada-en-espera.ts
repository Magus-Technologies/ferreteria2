import { create } from 'zustand'
import { getComprasResponseProps } from '~/app/_actions/compra'

type UseStoreCompraSeleccionadaEnEsperaProps = {
  compra?: getComprasResponseProps
  setCompra: (value: getComprasResponseProps | undefined) => void
}

export const useStoreCompraSeleccionadaEnEspera =
  create<UseStoreCompraSeleccionadaEnEsperaProps>(set => {
    return {
      compra: undefined,
      setCompra: value => set({ compra: value }),
    }
  })
