'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsDetalleDePrecios } from './columns-detalle-de-precios'
import { QueryKeys } from '~/app/_lib/queryKeys'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { useStoreProductoSeleccionado } from '../../store/store-producto-seleccionado'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputImport from '~/app/_components/form/inputs/input-import'
import { useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import {
  getProductoAlmacenByCodProductoAndAlmacenName,
  importarDetallesDePrecios,
  importarUnidadesDerivadas,
} from '~/app/_actions/unidadDerivada'

export default function TableDetalleDePrecios() {
  const tableRef = useRef<AgGridReact>(null)
  const can = usePermission()

  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const productoSeleccionado = useStoreProductoSeleccionado(
    store => store.producto
  )
  const setProductoSeleccionado = useStoreProductoSeleccionado(
    store => store.setProducto
  )

  const producto_en_almacen = productoSeleccionado?.producto_en_almacenes.find(
    item => item.almacen_id === almacen_id
  )

  const rowData = producto_en_almacen?.unidades_derivadas.map(item => ({
    ...item,
    almacen: producto_en_almacen?.almacen,
    producto: productoSeleccionado,
    producto_almacen: {
      costo: producto_en_almacen?.costo,
      stock_fraccion: producto_en_almacen?.stock_fraccion,
      ubicacion: producto_en_almacen?.ubicacion,
    },
  }))

  return (
    <TableWithTitle
      tableRef={tableRef}
      id='g-c-e-i.mi-almacen.detalle-de-precios'
      title='Detalle de precios'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      extraTitle={
        can(permissions.PRODUCTO_IMPORT) && (
          <InputImport
            tableRef={tableRef}
            schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
            fieldsIgnored={[
              'producto_almacen.costo',
              'producto.cod_producto',
              'unidad_derivada.name',
              'producto.name',
            ]}
            columnasExtra={[
              {
                headerName: 'producto_almacen',
                field: 'producto_almacen',
              },
              {
                headerName: 'unidad_derivada',
                field: 'unidad_derivada',
              },
            ]}
            preProcessData={async data => {
              if (!almacen_id) throw new Error('No se selecciono un almacén')

              if (
                data.some(
                  item =>
                    item['Cod. Producto'] === null ||
                    item['Cod. Producto'] === '' ||
                    item['Cod. Producto'] === undefined
                )
              )
                throw new Error(
                  'Todas las Unidades Derivadas deben tener un Código de Producto obligatoriamente'
                )

              const preResponse = new Set<string>(
                data.map(item => `${item['Cod. Producto']}`)
              )
              const response =
                await getProductoAlmacenByCodProductoAndAlmacenName(
                  Array.from(preResponse).map(cod_producto => ({
                    cod_producto,
                    almacen_id,
                  }))
                )
              if (!response.data)
                throw new Error(
                  'No se encontraron los Productos en este Almacén'
                )

              const preUnidadesDerivadas = new Set<string>(
                data.map(item => `${item['Formato']}`)
              )
              const unidades_derivadas = await importarUnidadesDerivadas(
                Array.from(preUnidadesDerivadas).map(name => ({
                  name,
                }))
              )
              if (!unidades_derivadas.data)
                throw new Error('No se encontraron unidades derivadas')

              const newData = data.map(item => ({
                ...item,
                producto_almacen: {
                  connect: {
                    id: response.data!.find(
                      ({ cod_producto }) =>
                        cod_producto === `${item['Cod. Producto']}`
                    )?.producto_almacen_id,
                  },
                },
                unidad_derivada: {
                  connect: {
                    id: unidades_derivadas.data!.find(
                      ({ name }) => name === item['Formato']
                    )?.id,
                  },
                },
              }))

              return newData
            }}
            propsUseServerMutation={{
              action: importarDetallesDePrecios,
              msgSuccess: 'Unidades Derivadas importadas exitosamente',
              onSuccess: () => setProductoSeleccionado(undefined),
              queryKey: [QueryKeys.PRODUCTOS],
            }}
          />
        )
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
        ...(can(permissions.PRODUCTO_IMPORT)
          ? [
              {
                color: 'warning' as const,
                label: 'Importación',
                columns: [
                  'Cod. Producto',
                  'Producto',
                  'Formato',
                  'Factor',
                  'P. Público',
                  'Comisión P. Público',
                  'P. Especial',
                  'Comisión P. Especial',
                  'Activador P. Especial',
                  'P. Mínimo',
                  'Comisión P. Mínimo',
                  'Activador P. Mínimo',
                  'P. Último',
                  'Comisión P. Último',
                  'Activador P. Último',
                ],
              },
            ]
          : []),
      ]}
      rowData={rowData ?? []}
    />
  )
}
