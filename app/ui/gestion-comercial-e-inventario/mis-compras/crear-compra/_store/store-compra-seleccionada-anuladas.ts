import { create } from 'zustand'
import { getComprasResponseProps } from '~/app/_actions/compra'

type UseStoreCompraSeleccionadaAnuladasProps = {
  compra?: getComprasResponseProps
  setCompra: (value: getComprasResponseProps | undefined) => void
}

export const useStoreCompraSeleccionadaAnuladas =
  create<UseStoreCompraSeleccionadaAnuladasProps>(set => {
    return {
      compra: undefined,
      setCompra: value => set({ compra: value }),
    }
  })
