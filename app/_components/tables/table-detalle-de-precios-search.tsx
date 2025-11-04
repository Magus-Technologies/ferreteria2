'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreAlmacen } from '~/store/store-almacen'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { useColumnsDetalleDePrecios } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-detalle-de-precios'

export default function TableDetalleDePreciosSearch() {
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const productoSeleccionado = useStoreProductoSeleccionadoSearch(
    store => store.producto
  )

  const producto_en_almacen = productoSeleccionado?.producto_en_almacenes.find(
    item => item.almacen_id === almacen_id
  )

  const rowData = producto_en_almacen
    ? producto_en_almacen!.unidades_derivadas?.map(item => ({
        ...item,
        almacen: producto_en_almacen!.almacen,
        producto: productoSeleccionado!,
        producto_almacen: {
          costo: producto_en_almacen!.costo,
          stock_fraccion: producto_en_almacen!.stock_fraccion,
          ubicacion: producto_en_almacen!.ubicacion,
        },
      }))
    : []

  return (
    <TableWithTitle
      id='g-c-e-i.detalle-de-precios-search'
      title='Detalle de precios'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      extraTitle={
        <>
          {' '}
          de
          <span className='italic -ml-2 text-blue-900'>
            {productoSeleccionado ? productoSeleccionado.name : '-'}
          </span>
        </>
      }
      columnDefs={useColumnsDetalleDePrecios()}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Formato',
            'Factor',
            'P. Compra',
            '% Venta',
            'P. Público',
            'Ganancia',
            'P. Especial',
            'P. Mínimo',
            'P. Último',
          ],
        },
      ]}
      rowData={rowData ?? []}
    />
  )
}
