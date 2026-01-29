'use client'

import TableUltimasComprasIngresadas from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/table-ultimas-compras-ingresadas'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'

export default function TableUltimasComprasIngresadasSearch() {
  const productoSeleccionado = useStoreProductoSeleccionadoSearch(
    store => store.producto
  )
  return (
    <TableUltimasComprasIngresadas
      id='g-c-e-i.ultimas-compras-ingresadas-search'
      productoSeleccionado={productoSeleccionado}
    />
  )
}
