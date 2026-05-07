import { create } from 'zustand'
import dayjs from 'dayjs'

// API-compatible filter interface for gastos
interface FiltrosMisGastos {
  almacen_id?: number
  fechaDesde?: string
  fechaHasta?: string
  motivoGasto?: string
  cajeroRegistra?: string
  sucursal?: string
  busqueda?: string
}

interface StoreFiltrosMisGastos {
  filtros: FiltrosMisGastos | null
  setFiltros: (filtros: FiltrosMisGastos) => void
  resetFiltros: () => void
}

export const useStoreFiltrosMisGastos = create<StoreFiltrosMisGastos>((set) => ({
  filtros: {
    fechaDesde: dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    fechaHasta: dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
  },
  setFiltros: (filtros) => set({ filtros }),
  resetFiltros: () => set({ filtros: null }),
}))