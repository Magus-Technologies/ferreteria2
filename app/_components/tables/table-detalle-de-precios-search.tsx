'use client'

import { useState } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreAlmacen } from '~/store/store-almacen'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { useColumnsDetalleDePrecios, DetalleDePreciosProps } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-detalle-de-precios'
import { CostoUnidadDerivadaSearch } from '../modals/modal-producto-search'
import ModalEditarPreciosProducto from '../modals/modal-editar-precios-producto'
import { RowDoubleClickedEvent } from 'ag-grid-community'

export default function TableDetalleDePreciosSearch({
  costoUnidadDerivada,
}: {
  costoUnidadDerivada: CostoUnidadDerivadaSearch
}) {
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const productoSeleccionado = useStoreProductoSeleccionadoSearch(
    store => store.producto
  )

  const [openModalEditarPrecios, setOpenModalEditarPrecios] = useState(false)
  const [detallePrecioSeleccionado, setDetallePrecioSeleccionado] = useState<DetalleDePreciosProps | null>(null)

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

  const unidad_derivada = producto_en_almacen?.unidades_derivadas.find(
    item => item.unidad_derivada.id === costoUnidadDerivada?.unidad_derivada_id
  )
  const nuevo_costo_general =
    Number(costoUnidadDerivada?.costo ?? 0) /
    Number(unidad_derivada?.factor ?? 1)

  const handleRowDoubleClicked = (event: RowDoubleClickedEvent<DetalleDePreciosProps>) => {
    if (event.data) {
      setDetallePrecioSeleccionado(event.data)
      setOpenModalEditarPrecios(true)
    }
  }

  return (
    <>
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
        rowClassRules={{
          'bg-yellow-400!': params =>
            nuevo_costo_general
              ? Number(params.data?.precio_publico ?? 0) <
                Number(nuevo_costo_general * Number(params.data?.factor ?? 0))
              : false,
        }}
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
        rowData={(rowData as unknown) as DetalleDePreciosProps[] ?? []}
        onRowDoubleClicked={handleRowDoubleClicked}
      />
      
      <ModalEditarPreciosProducto
        open={openModalEditarPrecios}
        setOpen={setOpenModalEditarPrecios}
        detallePrecio={detallePrecioSeleccionado}
        almacen_id={almacen_id!}
      />
    </>
  )
}
