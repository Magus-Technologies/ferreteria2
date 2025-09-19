import { create } from 'zustand'
import { dataEditProveedor } from '../_components/modals/modal-create-proveedor'

type UseStoreProveedorSeleccionadoProps = {
  proveedor?: dataEditProveedor
  setProveedor: (value: dataEditProveedor | undefined) => void
}

export const useStoreProveedorSeleccionado =
  create<UseStoreProveedorSeleccionadoProps>(set => {
    return {
      proveedor: undefined,
      setProveedor: value => set({ proveedor: value }),
    }
  })
