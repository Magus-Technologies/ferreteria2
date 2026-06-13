import { create } from 'zustand'
import dayjs from 'dayjs'
import { useStoreAlmacen } from '~/store/store-almacen'

/**
 * Filtros del dashboard de gestión-comercial (rango de fechas). El almacén se
 * toma del selector global de sucursales (useStoreAlmacen).
 */
type StoreDashboardFiltros = {
  desde: string // YYYY-MM-DD
  hasta: string // YYYY-MM-DD
  setRango: (desde: string, hasta: string) => void
}

export const useStoreDashboardFiltrosGCI = create<StoreDashboardFiltros>((set) => ({
  desde: dayjs().startOf('month').format('YYYY-MM-DD'),
  hasta: dayjs().endOf('month').format('YYYY-MM-DD'),
  setRango: (desde, hasta) => set({ desde, hasta }),
}))

/** Filtros listos para los endpoints (fechas + almacén). */
export function useFiltrosDashboardGCI() {
  const desde = useStoreDashboardFiltrosGCI((s) => s.desde)
  const hasta = useStoreDashboardFiltrosGCI((s) => s.hasta)
  const almacen_id = useStoreAlmacen((s) => s.almacen_id)
  return { desde, hasta, almacen_id }
}
