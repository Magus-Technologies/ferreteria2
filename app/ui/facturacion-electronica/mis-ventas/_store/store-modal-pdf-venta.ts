import { create } from 'zustand'

type UseStoreModalPdfVenta = {
  open: boolean
  ventaId: string | undefined
  setOpen: (open: boolean) => void
  setVentaId: (ventaId: string | undefined) => void
  openModal: (ventaId: string) => void
  closeModal: () => void
}

export const useStoreModalPdfVenta = create<UseStoreModalPdfVenta>((set) => ({
  open: false,
  ventaId: undefined,
  setOpen: (open) => set({ open }),
  setVentaId: (ventaId) => set({ ventaId }),
  openModal: (ventaId) => set({ open: true, ventaId }),
  closeModal: () => set({ open: false, ventaId: undefined }),
}))
