'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsProductos } from './columns-productos'
import { useServerQuery } from '~/hooks/use-server-query'
import { getProductos, importarProductos } from '~/app/_actions/producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputImport from '~/app/_components/form/inputs/input-import'
import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { ProductoCreateInputSchema } from '~/prisma/generated/zod'
import InputUploadMasivo from '../inputs/input-upload-masivo'

export default function TableProductos() {
  const tableRef = useRef<AgGridReact>(null)
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const can = usePermission()

  const { response } = useServerQuery({
    action: getProductos,
    propsQuery: {
      queryKey: [QueryKeys.PRODUCTOS],
    },
    params: undefined,
  })

  return (
    <TableWithTitle
      id='g-c-e-i.mi-almacen.productos'
      tableRef={tableRef}
      title='Productos'
      schema={ProductoCreateInputSchema}
      extraTitle={
        can(permissions.PRODUCTO_IMPORT) && (
          <>
            <InputImport
              tableRef={tableRef}
              schema={ProductoCreateInputSchema}
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
                  'S. Min',
                  'S. Max',
                  'Activo',
                  'Acción Técnica',
                ],
              },
            ]
          : []),
      ]}
    />
  )
}
