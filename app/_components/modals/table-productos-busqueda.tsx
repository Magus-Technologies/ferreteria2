'use client'

import TableWithTitle, {
  TableWithTitleProps,
} from '~/components/tables/table-with-title'
import { useQuery } from '@tanstack/react-query'
import { productosApiV2 } from '~/lib/api/producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import type { Producto } from '~/app/_types/producto'
import { ColDef } from 'ag-grid-community'
import { useMemo } from 'react'
import { getStock } from '~/app/_utils/get-stock'
import { greenColors } from '~/lib/colors'

interface TableProductosBusquedaProps
  extends Omit<
    TableWithTitleProps<Producto>,
    'id' | 'title' | 'onRowDoubleClicked'
  > {
  value: string
  onRowDoubleClicked?: (producto: Producto | undefined) => void
}

export default function TableProductosBusqueda({
  value,
  onRowDoubleClicked,
  ...props
}: TableProductosBusquedaProps) {
  const almacenId = useStoreAlmacen((s) => s.almacen_id)

  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.PRODUCTOS_BY_ALMACEN, almacenId, value],
    queryFn: async () => {
      if (!almacenId) return { data: [] }
      const res = await productosApiV2.getAllByAlmacen({
        almacen_id: almacenId,
        search: value || undefined,
        per_page: 100,
        estado: 1,
      })
      return res.data
    },
    enabled: !!almacenId,
    staleTime: 1000 * 60 * 2,
  })

  const productos = useMemo(() => data?.data ?? [], [data])

  const columns: ColDef<Producto>[] = useMemo(
    () => [
      {
        headerName: 'Código',
        field: 'cod_producto',
        width: 100,
        filter: true,
      },
      {
        headerName: 'Producto',
        field: 'name',
        flex: 1,
        minWidth: 300,
        filter: true,
      },
      {
        headerName: 'Marca',
        field: 'marca.name',
        width: 150,
        filter: true,
        valueGetter: (params) => params.data?.marca?.name || '',
      },
      {
        headerName: 'Categoría',
        field: 'categoria.name',
        width: 150,
        filter: true,
        valueGetter: (params) => params.data?.categoria?.name || '',
      },
      {
        headerName: 'Stock',
        field: 'producto_en_almacenes',
        width: 120,
        valueFormatter: (params) => {
          const productoEnAlmacen = params.data?.producto_en_almacenes?.find(
            (pea) => pea.almacen_id === almacenId
          )
          if (!productoEnAlmacen) return '0'
          return getStock({
            stock_fraccion: Number(productoEnAlmacen.stock_fraccion ?? 0),
            unidades_contenidas: Number(params.data?.unidades_contenidas ?? 1),
          }).stock
        },
      },
    ],
    [almacenId]
  )

  return (
    <TableWithTitle<Producto>
      {...props}
      id='productos-busqueda-complementario'
      title='Productos Disponibles'
      selectionColor={greenColors[10]}
      loading={isLoading}
      columnDefs={columns}
      rowData={productos}
      onRowDoubleClicked={({ data }) => {
        onRowDoubleClicked?.(data)
      }}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['#', 'Código', 'Producto', 'Marca', 'Categoría', 'Stock'],
        },
      ]}
    />
  )
}
