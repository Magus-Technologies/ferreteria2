import { create } from 'zustand'
import { getClienteResponseProps } from '~/app/_actions/cliente'

type UseStoreClienteSeleccionadoProps = {
  cliente?: getClienteResponseProps
  setCliente: (value: getClienteResponseProps | undefined) => void
}

export const useStoreClienteSeleccionado =
  create<UseStoreClienteSeleccionadoProps>(set => {
    return {
      cliente: undefined,
      setCliente: value => set({ cliente: value }),
    }
  })
