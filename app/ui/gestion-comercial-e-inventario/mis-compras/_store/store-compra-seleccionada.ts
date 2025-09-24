import { create } from 'zustand'
import { TableComprasProps } from '../_components/tables/columns-compras'

type UseStoreCompraSeleccionadaProps = {
  compra?: TableComprasProps
  setCompra: (value: TableComprasProps | undefined) => void
}

export const useStoreCompraSeleccionada =
  create<UseStoreCompraSeleccionadaProps>(set => {
    return {
      compra: undefined,
      setCompra: value => set({ compra: value }),
    }
  })
