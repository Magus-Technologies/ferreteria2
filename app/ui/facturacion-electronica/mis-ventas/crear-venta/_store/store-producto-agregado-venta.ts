import { create } from 'zustand'
import { FormCreateVenta } from '../_components/others/body-vender'
import { TipoMoneda } from '~/lib/api/venta'
import type { Producto } from '~/app/_types/producto'
import type { ValeCompra } from '~/lib/api/vales-compra'

// Identidad estable por fila del carrito. Antes la daba Form.List (`field.key`);
// ahora que la tabla vive en este store (no en Ant Design Form), cada fila
// necesita la suya propia para que AG Grid (getRowId) y las funciones de
// update/remove puedan identificarla sin ambigüedad — incluso dos filas del
// mismo producto_id (ej. dos instancias de paquete) tienen cada una la suya.
let rowIdCounter = 0
export function generarRowId(): string {
  rowIdCounter += 1
  return `row-${Date.now()}-${rowIdCounter}`
}

export type ValuesCardAgregarProductoVenta = Partial<
  FormCreateVenta['productos'][number]
> & {
  // Agregar las unidades derivadas disponibles del producto
  unidades_derivadas_disponibles?: Producto['producto_en_almacenes'][number]['unidades_derivadas']
}

type UseStoreProductoAgregadoVentaProps = {
  productoAgregado?: ValuesCardAgregarProductoVenta
  // Catálogo de productos distintos ya agregados a la venta — SOLO guarda
  // `unidades_derivadas_disponibles` por producto_id para que los selects
  // (SelectUnidadDerivadaVenta, SelectTipoPrecioVenta) tengan de dónde leer
  // las opciones. NO son las filas reales de la tabla (ver `carrito`).
  productos: ValuesCardAgregarProductoVenta[]
  // Filas reales de la tabla de venta (una por producto/servicio/paquete/vale
  // en el carrito, identificadas por `_row_id`). Reemplaza a Form.List — ver
  // nota de performance en table-vender.tsx.
  carrito: ValuesCardAgregarProductoVenta[]
  tipo_moneda: TipoMoneda
  valesAplicables: ValeCompra[]
  valesExcluidos: number[]
  setProductoAgregado: (
    value: ValuesCardAgregarProductoVenta | undefined
  ) => void
  setProductos: (
    value:
      | ValuesCardAgregarProductoVenta[]
      | undefined
      | ((
          prev: ValuesCardAgregarProductoVenta[]
        ) => ValuesCardAgregarProductoVenta[])
  ) => void
  setCarrito: (
    value:
      | ValuesCardAgregarProductoVenta[]
      | undefined
      | ((
          prev: ValuesCardAgregarProductoVenta[]
        ) => ValuesCardAgregarProductoVenta[])
  ) => void
  setTipoMoneda: (value: TipoMoneda) => void
  setValesAplicables: (vales: ValeCompra[]) => void
  excluirVale: (valeId: number) => void
  limpiarValesExcluidos: () => void
  reset: () => void
}

export const useStoreProductoAgregadoVenta =
  create<UseStoreProductoAgregadoVentaProps>((set) => {
    return {
      productoAgregado: undefined,
      productos: [],
      carrito: [],
      tipo_moneda: TipoMoneda.SOLES,
      valesAplicables: [],
      valesExcluidos: [],
      setProductoAgregado: (value) => set({ productoAgregado: value }),
      setProductos: (value) =>
        set((state) => ({
          productos:
            typeof value === 'function' ? value(state.productos) : value ?? [],
        })),
      setCarrito: (value) =>
        set((state) => ({
          carrito:
            typeof value === 'function' ? value(state.carrito) : value ?? [],
        })),
      setTipoMoneda: (value) => set({ tipo_moneda: value }),
      setValesAplicables: (vales) => set({ valesAplicables: vales }),
      excluirVale: (valeId) =>
        set((state) => ({
          valesExcluidos: state.valesExcluidos.includes(valeId)
            ? state.valesExcluidos
            : [...state.valesExcluidos, valeId],
          valesAplicables: state.valesAplicables.filter((v) => v.id !== valeId),
        })),
      limpiarValesExcluidos: () => set({ valesExcluidos: [] }),
      reset: () =>
        set({
          productoAgregado: undefined,
          productos: [],
          carrito: [],
          tipo_moneda: TipoMoneda.SOLES,
          valesAplicables: [],
          valesExcluidos: [],
        }),
    }
  })
