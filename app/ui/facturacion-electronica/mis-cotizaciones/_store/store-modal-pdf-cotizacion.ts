import { create } from 'zustand'

type UseStoreModalPdfCotizacion = {
  open: boolean
  cotizacionId: string | undefined
  setOpen: (open: boolean) => void
  setCotizacionId: (cotizacionId: string | undefined) => void
  openModal: (cotizacionId: string) => void
  closeModal: () => void
}

export const useStoreModalPdfCotizacion = create<UseStoreModalPdfCotizacion>((set) => ({
  open: false,
  cotizacionId: undefined,
  setOpen: (open) => set({ open }),
  setCotizacionId: (cotizacionId) => set({ cotizacionId }),
  openModal: (cotizacionId) => set({ open: true, cotizacionId }),
  closeModal: () => set({ open: false, cotizacionId: undefined }),
}))
