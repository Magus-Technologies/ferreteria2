import { create } from 'zustand'

/**
 * Store para seleccionar múltiples Notas de Venta desde la tabla de mis-ventas.
 * Se usa para convertirlas a Factura/Boleta agrupadas por cliente.
 *
 * Nota: solo guardamos el `id` (no la venta entera) para evitar mantener data
 * desactualizada en el store si la lista se refresca. La venta se obtiene del
 * row data de AG Grid cuando el usuario presiona "Convertir".
 */
interface StoreMultiSeleccionNotas {
  ids: string[]
  toggle: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
}

export const useStoreMultiSeleccionNotas = create<StoreMultiSeleccionNotas>(
  (set, get) => ({
    ids: [],
    toggle: (id) =>
      set((state) =>
        state.ids.includes(id)
          ? { ids: state.ids.filter((x) => x !== id) }
          : { ids: [...state.ids, id] },
      ),
    clear: () => set({ ids: [] }),
    has: (id) => get().ids.includes(id),
  }),
)
