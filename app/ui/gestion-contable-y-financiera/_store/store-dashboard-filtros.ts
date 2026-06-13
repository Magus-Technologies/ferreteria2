import { create } from 'zustand'
import dayjs from 'dayjs'
import { useStoreAlmacen } from '~/store/store-almacen'

/**
 * Filtros del dashboard contable (rango de fechas). El almacén se toma del
 * selector global de sucursales (useStoreAlmacen).
 */
type StoreDashboardFiltros = {
  desde: string // YYYY-MM-DD
  hasta: string // YYYY-MM-DD
  setRango: (desde: string, hasta: string) => void
}

export const useStoreDashboardFiltrosGCF = create<StoreDashboardFiltros>((set) => ({
  desde: dayjs().startOf('month').format('YYYY-MM-DD'),
  hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
  setRango: (desde, hasta) => set({ desde, hasta }),
}))

/** Filtros listos para los endpoints (fechas + almacén). */
export function useFiltrosDashboardGCF() {
  const desde = useStoreDashboardFiltrosGCF((s) => s.desde)
  const hasta = useStoreDashboardFiltrosGCF((s) => s.hasta)
  const almacen_id = useStoreAlmacen((s) => s.almacen_id)
  return { desde, hasta, almacen_id }
}
