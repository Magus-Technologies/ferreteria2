import { create } from 'zustand'
import type { Proveedor } from '~/lib/api/proveedor'

type UseStoreProveedorSeleccionadoProps = {
  proveedor?: Proveedor
  setProveedor: (value: Proveedor | undefined) => void
  searchText: string
  setSearchText: (value: string) => void
}

export const useStoreProveedorSeleccionado =
  create<UseStoreProveedorSeleccionadoProps>(set => {
    return {
      proveedor: undefined,
      setProveedor: value => set({ proveedor: value }),
      searchText: '',
      setSearchText: value => set({ searchText: value }),
    }
  })
