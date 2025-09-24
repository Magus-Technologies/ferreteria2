import { create } from 'zustand'

type UseStoreCodigoAutomaticoProps = {
  disabled: boolean
  setDisabled: (value: boolean) => void
}

export const useStoreCodigoAutomatico = create<UseStoreCodigoAutomaticoProps>(
  set => {
    return {
      disabled: true,
      setDisabled: value => set({ disabled: value }),
    }
  }
)
