import { create } from 'zustand'
import { getProveedorResponseProps } from '~/app/_actions/proveedor'

type UseStoreProveedorSeleccionadoProps = {
  proveedor?: getProveedorResponseProps
  setProveedor: (value: getProveedorResponseProps | undefined) => void
}

export const useStoreProveedorSeleccionado =
  create<UseStoreProveedorSeleccionadoProps>(set => {
    return {
      proveedor: undefined,
      setProveedor: value => set({ proveedor: value }),
    }
  })
