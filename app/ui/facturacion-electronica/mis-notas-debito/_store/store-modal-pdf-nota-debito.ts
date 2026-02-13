import { create } from 'zustand'

type UseStoreModalPdfNotaDebito = {
    open: boolean
    notaDebitoId: string | undefined
    setOpen: (open: boolean) => void
    setNotaDebitoId: (notaDebitoId: string | undefined) => void
    openModal: (notaDebitoId: string) => void
    closeModal: () => void
}

export const useStoreModalPdfNotaDebito = create<UseStoreModalPdfNotaDebito>((set) => ({
    open: false,
    notaDebitoId: undefined,
    setOpen: (open) => set({ open }),
    setNotaDebitoId: (notaDebitoId) => set({ notaDebitoId }),
    openModal: (notaDebitoId) => set({ open: true, notaDebitoId }),
    closeModal: () => set({ open: false, notaDebitoId: undefined }),
}))
