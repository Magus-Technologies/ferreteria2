'use client'

import { usePaginatedServerQuery } from '~/hooks/use-paginated-server-query'
import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductos } from './columns-productos'
import {
  getProductosPaginated,
  importarProductos,
  type getProductosResponseProps,
} from '~/app/_actions/producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputImport from '~/app/_components/form/inputs/input-import'
import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { ProductoCreateInputSchema } from '~/prisma/generated/zod'
import InputUploadMasivo from '../inputs/input-upload-masivo'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'
import { importarUbicaciones } from '~/app/_actions/ubicacion'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { App } from 'antd'
import PaginationControls from '~/app/_components/tables/pagination-controls'

function TableProductos() {
  const tableRef = useRef<AgGridReact>(null)
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const { notification } = App.useApp()

  const setProductoSeleccionado = useStoreProductoSeleccionado(
    store => store.setProducto
  )

  const filtros = useStoreFiltrosProductos(state => state.filtros)

  const can = usePermission()

  const columns = useColumnsProductos({ almacen_id })

  const { 
    response, 
    loading,
    currentPage,
    totalPages,
    total,
    nextPage,
    prevPage,
    pageSize
  } = usePaginatedServerQuery({
    action: getProductosPaginated,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS],
    },
    params: {
      where: filtros,
    },
    pageSize: 100, // 100 productos por página
    enabled: !!filtros,
  })

  return (
    <TableWithTitle<getProductosResponseProps>
      id='g-c-e-i.mi-almacen.productos'
      onSelectionChanged={({ selectedNodes }) =>
        setProductoSeleccionado(selectedNodes?.[0]?.data)
      }
      tableRef={tableRef}
      title='Productos'
      schema={ProductoCreateInputSchema}
      headersRequired={['Ubicación en Almacén']}
      loading={loading}
      columnDefs={columns}
      rowData={response}
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
                onSuccess: res => {
                  if (res.data?.length)
                    notification.info({
                      message: 'Productos duplicados',
                      description: (
                        <div className='max-h-[60dvh] overflow-y-auto'>
                          <p>
                            Los siguientes productos no se subieron porque ya
                            existen:
                          </p>
                          {res.data.map((item, index) => (
                            <div key={index} className='pr-4'>
                              <div className='grid grid-cols-3 gap-x-4 pl-8'>
                                <span className='text-red-500 text-nowrap'>
                                  {item.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ),
                    })
                },
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
    >
      {/* Paginación */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        total={total}
        pageSize={pageSize}
        loading={loading}
        onNextPage={nextPage}
        onPrevPage={prevPage}
      />
    </TableWithTitle>
  )
}

export default TableProductos
