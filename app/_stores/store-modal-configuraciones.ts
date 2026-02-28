import { create } from 'zustand'

interface ModalConfiguracionesStore {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const useModalConfiguraciones = create<ModalConfiguracionesStore>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}))
