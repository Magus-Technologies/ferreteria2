import { create } from 'zustand'

type UseStoreModalPdfNotaCredito = {
  open: boolean
  notaCreditoId: string | undefined
  setOpen: (open: boolean) => void
  setNotaCreditoId: (notaCreditoId: string | undefined) => void
  openModal: (notaCreditoId: string) => void
  closeModal: () => void
}

export const useStoreModalPdfNotaCredito = create<UseStoreModalPdfNotaCredito>((set) => ({
  open: false,
  notaCreditoId: undefined,
  setOpen: (open) => set({ open }),
  setNotaCreditoId: (notaCreditoId) => set({ notaCreditoId }),
  openModal: (notaCreditoId) => set({ open: true, notaCreditoId }),
  closeModal: () => set({ open: false, notaCreditoId: undefined }),
}))
