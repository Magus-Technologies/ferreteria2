import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TipoFormato = 'ticket' | 'a4'

interface ImpresoraPreferencia {
  nombre: string
  formato: TipoFormato
}

interface StoreImpresora {
  impresoraTicket: string | null
  impresoraA4: string | null
  setImpresoraDefault: (formato: TipoFormato, nombre: string) => void
  getImpresoraDefault: (formato: TipoFormato) => string | null
  clearImpresoraDefault: (formato: TipoFormato) => void
}

export const useStoreImpresora = create<StoreImpresora>()(
  persist(
    (set, get) => ({
      impresoraTicket: null,
      impresoraA4: null,

      setImpresoraDefault: (formato, nombre) =>
        set(
          formato === 'ticket'
            ? { impresoraTicket: nombre }
            : { impresoraA4: nombre }
        ),

      getImpresoraDefault: (formato) => {
        const state = get()
        return formato === 'ticket' ? state.impresoraTicket : state.impresoraA4
      },

      clearImpresoraDefault: (formato) =>
        set(
          formato === 'ticket'
            ? { impresoraTicket: null }
            : { impresoraA4: null }
        ),
    }),
    {
      name: 'impresora-storage',
    }
  )
)
