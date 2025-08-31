'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductos } from './columns-productos'
import { useServerQuery } from '~/hooks/use-server-query'
import { getProductos, importarProductos } from '~/app/_actions/producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputImport from '~/app/_components/form/inputs/input-import'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { ProductoCreateInputSchema } from '~/prisma/generated/zod'
import InputUploadMasivo from '../inputs/input-upload-masivo'
import { useStoreProductoSeleccionado } from '../../store/store-producto-seleccionado'
import { importarUbicaciones } from '~/app/_actions/ubicacion'
import { useStoreFiltrosProductos } from '../../store/store-filtros-productos'

export default function TableProductos() {
  const tableRef = useRef<AgGridReact>(null)
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const [primera_vez, setPrimeraVez] = useState(true)

  const setProductoSeleccionado = useStoreProductoSeleccionado(
    store => store.setProducto
  )

  const filtros = useStoreFiltrosProductos(state => state.filtros)

  const can = usePermission()

  const { response, refetch, loading } = useServerQuery({
    action: getProductos,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS],
    },
    params: {
      where: filtros,
    },
  })

  useEffect(() => {
    if (!loading && filtros) setPrimeraVez(false)
  }, [loading, filtros])

  useEffect(() => {
    if (!primera_vez) refetch()
  }, [filtros, refetch, primera_vez])

  type ResponseItem = NonNullable<typeof response>[number]

  return (
    <TableWithTitle<ResponseItem>
      id='g-c-e-i.mi-almacen.productos'
      onSelectionChanged={({ selectedNodes }) =>
        setProductoSeleccionado(selectedNodes?.[0]?.data as ResponseItem)
      }
      tableRef={tableRef}
      title='Productos'
      schema={ProductoCreateInputSchema}
      headersRequired={['Ubicación en Almacén']}
      loading={loading}
      extraTitle={
        can(permissions.PRODUCTO_IMPORT) && (
          <>
            <InputImport
              tableRef={tableRef}
              schema={ProductoCreateInputSchema}
              columnasExtra={[
                {
                  headerName: 'producto_en_almacenes',
                  field: 'producto_en_almacenes',
                },
              ]}
              preProcessData={async data => {
                if (!almacen_id) throw new Error('No se selecciono un almacén')

                if (data.some(item => !item['Ubicación en Almacén']))
                  throw new Error(
                    'Todos los productos deben tener una ubicación obligatoriamente'
                  )

                const ubicacionesNames = new Set(
                  data.map(item => item['Ubicación en Almacén'] as string)
                )
                const ubicaciones = await importarUbicaciones(
                  Array.from(ubicacionesNames).map(name => ({
                    name,
                    almacen_id,
                  }))
                )

                if (!ubicaciones.data)
                  throw new Error('No se encontraron ubicaciones')

                const newData = data.map(item => {
                  const {
                    'Stock Fracción en Almacén': stock_fraccion,
                    'Costo en Almacén': costo,
                    'Ubicación en Almacén': ubicacion,
                    ...rest
                  } = item
                  return {
                    ...rest,
                    producto_en_almacenes: {
                      create: {
                        stock_fraccion,
                        costo,
                        ubicacion_id: ubicaciones.data!.find(
                          item => item.name === ubicacion
                        )!.id,
                        almacen_id,
                      },
                    },
                  }
                })

                return newData
              }}
              propsUseServerMutation={{
                action: importarProductos,
                msgSuccess: 'Productos importados exitosamente',
                queryKey: [
                  QueryKeys.PRODUCTOS,
                  QueryKeys.MARCAS,
                  QueryKeys.CATEGORIAS,
                  QueryKeys.UNIDADES_MEDIDA,
                ],
              }}
            />
            <InputUploadMasivo
              accept='image/*'
              buttonProps={{ color: 'warning' }}
              tipo='img'
              buttonTitle='Subir Imágenes'
            />
            <InputUploadMasivo
              accept='application/pdf'
              buttonProps={{ color: 'danger' }}
              tipo='ficha_tecnica'
              buttonTitle='Subir Fichas Técnicas'
            />
          </>
        )
      }
      columnDefs={useColumnsProductos({ almacen_id })}
      rowData={response}
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
        ...(can(permissions.PRODUCTO_IMPORT)
          ? [
              {
                color: 'warning' as const,
                label: 'Importación',
                columns: [
                  'Código de Producto',
                  'Código de Barra',
                  'Producto',
                  'Ticket',
                  'U. Contenidas',
                  'Marca',
                  'Categoria',
                  'Unidad de Medida',
                  'Ubicación en Almacén',
                  'Stock Fracción en Almacén',
                  'Costo en Almacén',
                  'S. Min',
                  'S. Max',
                  'Activo',
                  'Acción Técnica',
                  'Ruta IMG',
                  'Ruta Ficha Técnica',
                ],
              },
            ]
          : []),
      ]}
    />
  )
}
