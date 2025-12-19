import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UseStoreAlmacenProps = {
  almacen_id?: number
  setAlmacenId: (value: number | undefined) => void
}

export const useStoreAlmacen = create<UseStoreAlmacenProps>()(
  persist(
    (set) => ({
      almacen_id: 1, // Valor por defecto: Almacén Principal
      setAlmacenId: value => set({ almacen_id: value }),
    }),
    {
      name: 'almacen-storage', // nombre en localStorage
    }
  )
)
