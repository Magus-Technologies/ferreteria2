import { create } from 'zustand'
import type { getVentaResponseProps } from '~/lib/api/venta'

type UseStoreVentasEnEspera = {
  ventaSeleccionada?: getVentaResponseProps
  setVentaSeleccionada: (value: getVentaResponseProps | undefined) => void
}

export const useStoreVentasEnEspera = create<UseStoreVentasEnEspera>(set => ({
  ventaSeleccionada: undefined,
  setVentaSeleccionada: value => set({ ventaSeleccionada: value }),
}))
