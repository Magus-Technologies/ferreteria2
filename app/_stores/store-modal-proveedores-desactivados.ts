import { create } from 'zustand'

interface ModalProveedoresDesactivadosStore {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const useModalProveedoresDesactivados = create<ModalProveedoresDesactivadosStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}))
