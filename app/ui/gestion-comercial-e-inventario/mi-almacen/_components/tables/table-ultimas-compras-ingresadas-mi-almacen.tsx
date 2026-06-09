'use client'

import TableUltimasComprasIngresadas from './table-ultimas-compras-ingresadas'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { useProductosInfiniteScroll } from '../../_hooks/useProductosInfiniteScroll'

export default function TableUltimasComprasIngresadasMiAlmacen() {
  const productoSeleccionado = useStoreProductoSeleccionado(
    store => store.producto
  )
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const filtros = useStoreFiltrosProductos(state => state.filtros)

  // El producto del store viene del listado-completo, que NO incluye `compras`
  // (se excluye por peso). Tomamos la versión CON `compras` desde el mismo hook
  // que usa Detalle de Precios (getAllByAlmacen → findByAlmacen). Al compartir
  // queryKey/filtros/perPage con esa tabla, reutiliza la caché sin pedir de más.
  const { data: productosData } = useProductosInfiniteScroll({
    filtros: {
      ...filtros,
      almacen_id: filtros?.almacen_id || almacen_id || 1,
    },
    enabled: !!filtros?.almacen_id,
    perPage: 1000,
  })

  const productoConCompras = productoSeleccionado
    ? productosData?.find(p => p.id === productoSeleccionado.id) ??
      productoSeleccionado
    : undefined

  return (
    <TableUltimasComprasIngresadas
      id='g-c-e-i.mi-almacen.ultimas-compras-ingresadas'
      productoSeleccionado={productoConCompras}
    />
  )
}
