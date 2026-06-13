import { create } from 'zustand'
import dayjs from 'dayjs'
import { useStoreAlmacen } from '~/store/store-almacen'

/**
 * Filtros del dashboard de facturación (rango de fechas). El almacén se toma
 * del selector global de sucursales (useStoreAlmacen).
 */
type StoreDashboardFiltros = {
  desde: string // YYYY-MM-DD
  hasta: string // YYYY-MM-DD
  setRango: (desde: string, hasta: string) => void
}

export const useStoreDashboardFiltros = create<StoreDashboardFiltros>((set) => ({
  desde: dayjs().startOf('month').format('YYYY-MM-DD'),
  hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
  setRango: (desde, hasta) => set({ desde, hasta }),
}))

/** Filtros listos para enviar a los endpoints del dashboard (fechas + almacén). */
export function useFiltrosDashboard() {
  const desde = useStoreDashboardFiltros((s) => s.desde)
  const hasta = useStoreDashboardFiltros((s) => s.hasta)
  const almacen_id = useStoreAlmacen((s) => s.almacen_id)
  return { desde, hasta, almacen_id }
}
