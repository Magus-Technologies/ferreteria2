import { create } from 'zustand'
import { Dayjs } from 'dayjs'

type UseStoreFiltrosMisGuiasProps = {
  filtros: {
    fecha_desde?: Dayjs
    fecha_hasta?: Dayjs
    tipo_guia?: string
    afecta_stock?: string // 'true' | 'false'
  }
  setFiltros: (filtros: UseStoreFiltrosMisGuiasProps['filtros']) => void
}

export const useStoreFiltrosMisGuias = create<UseStoreFiltrosMisGuiasProps>(
  (set) => ({
    filtros: {},
    setFiltros: (filtros) => set({ filtros }),
  })
)
