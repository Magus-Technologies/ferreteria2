import { create } from 'zustand'
import { Cliente } from '~/lib/api/cliente'

type UseStoreClienteSeleccionadoProps = {
  cliente?: Cliente
  setCliente: (value: Cliente | undefined) => void
}

export const useStoreClienteSeleccionado =
  create<UseStoreClienteSeleccionadoProps>(set => {
    return {
      cliente: undefined,
      setCliente: value => set({ cliente: value }),
    }
  })
