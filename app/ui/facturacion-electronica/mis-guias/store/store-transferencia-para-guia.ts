import { create } from 'zustand'
import type { TransferenciaStock } from '~/lib/api/transferencia-stock'

type State = {
  transferencia: TransferenciaStock | null
  setTransferencia: (t: TransferenciaStock | null) => void
}

export const useStoreTransferenciaParaGuia = create<State>((set) => ({
  transferencia: null,
  setTransferencia: (transferencia) => set({ transferencia }),
}))
