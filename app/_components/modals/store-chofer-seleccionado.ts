import { create } from 'zustand'
import { Chofer } from '~/lib/api/chofer'

type UseStoreChoferSeleccionado = {
  chofer?: Chofer
  setChofer: (chofer: Chofer | undefined) => void
}

export const useStoreChoferSeleccionado = create<UseStoreChoferSeleccionado>(
  set => ({
    chofer: undefined,
    setChofer: chofer => set({ chofer }),
  })
)
