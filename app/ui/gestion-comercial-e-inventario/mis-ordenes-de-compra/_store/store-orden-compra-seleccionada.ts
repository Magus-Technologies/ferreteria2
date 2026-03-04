import { create } from 'zustand'
import { type OrdenCompra } from '~/lib/api/orden-compra'

type UseStoreOrdenCompraSeleccionadaProps = {
    orden_compra?: OrdenCompra
    setOrdenCompra: (value: OrdenCompra | undefined) => void
}

export const useStoreOrdenCompraSeleccionada =
    create<UseStoreOrdenCompraSeleccionadaProps>(set => {
        return {
            orden_compra: undefined,
            setOrdenCompra: value => set({ orden_compra: value }),
        }
    })
