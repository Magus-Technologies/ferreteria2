import { create } from 'zustand'

interface StoreProductosVencidos {
    openModal: boolean
    setOpenModal: (open: boolean) => void
}

export const useStoreProductosVencidos = create<StoreProductosVencidos>(set => ({
    openModal: false,
    setOpenModal: open => set({ openModal: open }),
}))
