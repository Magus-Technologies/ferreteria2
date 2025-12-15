import {
  SearchProductos,
  getProductosResponseProps,
} from '~/app/_actions/producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useColumnsProductos } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-productos'
import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { useServerQuery } from '~/hooks/use-server-query'
import { TipoBusquedaProducto } from '../form/selects/select-tipo-busqueda-producto'
import { getFiltrosPorTipoBusqueda } from '../form/selects/select-productos'
import { ProductoCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { useStoreAlmacen } from '~/store/store-almacen'
import { RefObject, useEffect, useImperativeHandle, useMemo } from 'react'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'

export interface RefTableProductoSearchProps
  extends TableWithTitleProps<getProductosResponseProps> {
  handleRefetch: () => void
}

export default function TableProductoSearch({
  value,
  onRowDoubleClicked,
  tipoBusqueda,
  ref,
}: {
  value: string
  onRowDoubleClicked?: ({
    data,
  }: {
    data: getProductosResponseProps | undefined
  }) => void
  tipoBusqueda: TipoBusquedaProducto
  ref?: RefObject<RefTableProductoSearchProps | null>
}) {
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const { response, refetch, loading } = useServerQuery({
    action: SearchProductos, // Usar SearchProductos con límite de 50
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS_TABLE_SEARCH],
      enabled: false,
    },
    params: {
      where: {
        ...getFiltrosPorTipoBusqueda({
          tipoBusqueda,
          value,
        }),
        producto_en_almacenes: { some: { almacen_id } },
        permitido: true,
        estado: true,
      },
    },
  })

  type ResponseItem = NonNullable<typeof response>[number]

  const setProductoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    store => store.setProducto
  )

  const productosCompra = useStoreProductoAgregadoCompra(
    store => store.productos
  )
  const setProductosCompra = useStoreProductoAgregadoCompra(
    store => store.setProductos
  )

  const productosFiltrados = useMemo(() => {
    return (response || []).filter(
      producto =>
        !productosCompra.find(
          producto_compra => producto_compra.producto_id === producto.id
        )
    )
  }, [response, productosCompra])

  function handleRefetch() {
    if (value) {
      setProductosCompra([])
      refetch()
    }
  }

  useEffect(() => {
    handleRefetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, tipoBusqueda])

  useImperativeHandle(ref, () => ({
    handleRefetch: () => handleRefetch(),
  }))

  return (
    <TableWithTitle<ResponseItem>
      id='g-c-e-i.table-producto-search'
      onSelectionChanged={({ selectedNodes }) =>
        setProductoSeleccionadoSearchStore(
          selectedNodes?.[0]?.data as ResponseItem
        )
      }
      title='Productos'
      schema={ProductoCreateInputSchema}
      headersRequired={['Ubicación en Almacén']}
      loading={loading}
      columnDefs={useColumnsProductos({ almacen_id })}
      onRowDoubleClicked={({ data }) => {
        setProductoSeleccionadoSearchStore(data)
        onRowDoubleClicked?.({ data })
      }}
      rowData={productosFiltrados}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: [
            '#',
            'Código de Producto',
            'Producto',
            'U. Contenidas',
            'Marca',
            'Stock',
            'S. Min',
            'Activo',
            'Acciones',
          ],
        },
      ]}
    />
  )
}
