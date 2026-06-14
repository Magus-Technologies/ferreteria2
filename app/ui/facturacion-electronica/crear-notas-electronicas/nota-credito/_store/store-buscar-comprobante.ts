import { create } from 'zustand'

/**
 * Estado del modal "Cargar Factura/Boleta" de la nota de crédito.
 * Vive en un store para que el campo de búsqueda (que lo abre cuando el texto
 * no es un serie-número exacto) y el botón prominente del panel lateral
 * controlen el MISMO modal — igual que "Cargar Cotización" en crear-venta.
 */
type StoreBuscarComprobante = {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useStoreBuscarComprobanteCredito = create<StoreBuscarComprobante>(
  (set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  })
)
