import { create } from 'zustand'
import { getComprasResponseProps } from '~/app/_actions/compra'

type UseStoreCompraSeleccionadaProps = {
  compra?: getComprasResponseProps
  setCompra: (value: getComprasResponseProps | undefined) => void
}

export const useStoreCompraSeleccionada =
  create<UseStoreCompraSeleccionadaProps>(set => {
    return {
      compra: undefined,
      setCompra: value => set({ compra: value }),
    }
  })
