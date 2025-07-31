import { create } from 'zustand'

type UseStoreAlmacenProps = {
  almacen_id?: number
  setAlmacenId: (value: number | undefined) => void
}

export const useStoreAlmacen = create<UseStoreAlmacenProps>(set => {
  return {
    almacen_id: undefined,
    setAlmacenId: value => set({ almacen_id: value }),
  }
})
