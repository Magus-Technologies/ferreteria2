import { create } from 'zustand'

type UseStoreModalPdfGuia = {
  open: boolean
  guiaId: string | undefined
  setOpen: (open: boolean) => void
  setGuiaId: (guiaId: string | undefined) => void
  openModal: (guiaId: string) => void
  closeModal: () => void
}

export const useStoreModalPdfGuia = create<UseStoreModalPdfGuia>((set) => ({
  open: false,
  guiaId: undefined,
  setOpen: (open) => set({ open }),
  setGuiaId: (guiaId) => set({ guiaId }),
  openModal: (guiaId) => set({ open: true, guiaId }),
  closeModal: () => set({ open: false, guiaId: undefined }),
}))
