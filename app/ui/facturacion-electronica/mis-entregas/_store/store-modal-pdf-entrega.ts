import { create } from 'zustand'

/**
 * Store global para el modal de PDF de entrega.
 * Mirror del patrón usado en mis-ventas (`useStoreModalPdfVenta`):
 * el modal se renderiza una sola vez a nivel de página y cualquier
 * componente puede abrirlo via `openModal(entrega)`.
 */
type UseStoreModalPdfEntrega = {
  open: boolean
  entrega: any | undefined
  setOpen: (open: boolean) => void
  setEntrega: (entrega: any | undefined) => void
  openModal: (entrega: any) => void
  closeModal: () => void
}

export const useStoreModalPdfEntrega = create<UseStoreModalPdfEntrega>(
  (set) => ({
    open: false,
    entrega: undefined,
    setOpen: (open) => set({ open }),
    setEntrega: (entrega) => set({ entrega }),
    openModal: (entrega) => set({ open: true, entrega }),
    closeModal: () => set({ open: false, entrega: undefined }),
  }),
)
