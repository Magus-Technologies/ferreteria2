import { create } from 'zustand'
import { Dayjs } from 'dayjs'

type UseStoreFiltrosMisGuiasProps = {
  filtros: {
    fecha_desde?: Dayjs
    fecha_hasta?: Dayjs
    estado?: string // 'BORRADOR' | 'EMITIDA' | 'ANULADA'
    // Estado ante SUNAT. 'sin_enviar' = electrónicas todavía no declaradas.
    estado_sunat?: string
    tipo_guia?: string // 'ELECTRONICA_REMITENTE' | 'ELECTRONICA_TRANSPORTISTA' | 'FISICA'
    search?: string
  }
  setFiltros: (filtros: UseStoreFiltrosMisGuiasProps['filtros']) => void
}

export const useStoreFiltrosMisGuias = create<UseStoreFiltrosMisGuiasProps>(
  (set) => ({
    filtros: {},
    setFiltros: (filtros) => set({ filtros }),
  })
)
