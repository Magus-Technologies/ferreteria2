import { create } from 'zustand'

type UseStoreTipoDeCambioProps = {
  tipo_de_cambio: number
  setTipoDeCambio: (value: number) => void
}

export const useStoreTipoDeCambio = create<UseStoreTipoDeCambioProps>(set => {
  return {
    tipo_de_cambio: 1,
    setTipoDeCambio: value => set({ tipo_de_cambio: value }),
  }
})
