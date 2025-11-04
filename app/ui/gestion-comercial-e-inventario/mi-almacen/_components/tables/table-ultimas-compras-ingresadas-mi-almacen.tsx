'use client'

import TableUltimasComprasIngresadas from './table-ultimas-compras-ingresadas'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'

export default function TableUltimasComprasIngresadasMiAlmacen() {
  const productoSeleccionado = useStoreProductoSeleccionado(
    store => store.producto
  )
  return (
    <TableUltimasComprasIngresadas
      id='g-c-e-i.mi-almacen.ultimas-compras-ingresadas'
      productoSeleccionado={productoSeleccionado}
    />
  )
}
