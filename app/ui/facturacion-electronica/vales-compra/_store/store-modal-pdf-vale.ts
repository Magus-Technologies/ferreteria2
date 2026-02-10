import { create } from 'zustand'

type UseStoreModalPdfVale = {
  open: boolean
  valeId: number | undefined
  setOpen: (open: boolean) => void
  setValeId: (valeId: number | undefined) => void
  openModal: (valeId: number) => void
  closeModal: () => void
}

export const useStoreModalPdfVale = create<UseStoreModalPdfVale>((set) => ({
  open: false,
  valeId: undefined,
  setOpen: (open) => set({ open }),
  setValeId: (valeId) => set({ valeId }),
  openModal: (valeId) => set({ open: true, valeId }),
  closeModal: () => set({ open: false, valeId: undefined }),
}))
