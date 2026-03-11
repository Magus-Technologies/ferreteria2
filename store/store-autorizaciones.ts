import { create } from 'zustand'

interface StoreAutorizaciones {
  pendientesCount: number
  setPendientesCount: (count: number) => void
}

export const useStoreAutorizaciones = create<StoreAutorizaciones>((set) => ({
  pendientesCount: 0,
  setPendientesCount: (count) => set({ pendientesCount: count }),
}))
