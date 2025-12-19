'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsDetalleDePrecios } from './columns-detalle-de-precios'
import { QueryKeys } from '~/app/_lib/queryKeys'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputImport from '~/app/_components/form/inputs/input-import'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { detallePreciosApi, ImportDetallePreciosItem } from '~/lib/api/detalle-precios'
import { useQueryClient } from '@tanstack/react-query'
import ButtonBase from '~/components/buttons/button-base'
import { ServerResult } from '~/auth/middleware-server-actions'
import { getProductosResponseProps } from '~/app/_actions/producto'

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

  const queryClient = useQueryClient()

  const data = queryClient.getQueryData<
    ServerResult<getProductosResponseProps[]>
  >([QueryKeys.PRODUCTOS])

  const [primeraData, setPrimeraData] = useState(0)
  useEffect(() => {
    if (data && primeraData < 1) setPrimeraData(prev => prev + 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, productoSeleccionado])

  const productos_completos = data?.data

  const rowData =
    primeraData < 1
      ? []
      : producto_en_almacen
      ? producto_en_almacen?.unidades_derivadas?.map(item => ({
          ...item,
          almacen: producto_en_almacen?.almacen,
          producto: productoSeleccionado,
          producto_almacen: {
            costo: producto_en_almacen?.costo,
            stock_fraccion: producto_en_almacen?.stock_fraccion,
            ubicacion: producto_en_almacen?.ubicacion,
          },
        }))
      : productos_completos?.flatMap(producto_seleccionado_aux =>
          producto_seleccionado_aux?.producto_en_almacenes?.flatMap(
            producto_en_almacen_aux =>
              producto_en_almacen_aux?.unidades_derivadas?.map(item => ({
                ...item,
                almacen: producto_en_almacen_aux?.almacen,
                producto: producto_seleccionado_aux,
                producto_almacen: {
                  costo: producto_en_almacen_aux?.costo,
                  stock_fraccion: producto_en_almacen_aux?.stock_fraccion,
                  ubicacion: producto_en_almacen_aux?.ubicacion,
                },
              }))
          )
        )

  return (
    <TableWithTitle
      tableRef={tableRef}
      id='g-c-e-i.mi-almacen.detalle-de-precios'
      title='Detalle de precios'
      schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
      headersRequired={['Cod. Producto']}
      extraTitle={
        <>
          {' '}
          de
          <span className='italic -ml-2 text-blue-900'>
            {primeraData < 1
              ? '-'
              : productoSeleccionado
              ? productoSeleccionado.name
              : 'TODOS LOS PRODUCTOS FILTRADOS'}
          </span>
          <ButtonBase
            onClick={() => {
              if (primeraData < 2) setPrimeraData(prev => prev + 1)
              setProductoSeleccionado(undefined)
            }}
            color='warning'
            size='sm'
          >
            Ver Todo
          </ButtonBase>
          {can(permissions.PRODUCTO_IMPORT) && (
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
                const response = await detallePreciosApi.getProductoAlmacenByCodProducto(
                  Array.from(preResponse).map(cod_producto => ({
                    cod_producto,
                    almacen_id,
                  }))
                )
                
                if (response.error || !response.data) {
                  const errorMsg = response.error?.message || 'No se encontraron los Productos en este Almacén';
                  throw new Error(
                    `${errorMsg}\n\n⚠️ IMPORTANTE: Debes importar los PRODUCTOS primero antes de importar el Detalle de Precios.\n\nPasos:\n1. Importa el Excel de Productos\n2. Luego importa el Excel de Detalle de Precios`
                  );
                }

                // Mostrar advertencias si hay productos omitidos
                if (response.data.advertencias && response.data.advertencias.length > 0) {
                  console.warn('⚠️ Advertencias al importar:', response.data.advertencias);
                  // Opcional: Mostrar notificación al usuario
                  // notification.warning({
                  //   message: 'Productos omitidos',
                  //   description: response.data.advertencias.join('\n'),
                  //   duration: 10,
                  // });
                }

                const preUnidadesDerivadas = new Set<string>(
                  data.map(item => `${item['Formato']}`)
                )
                const unidades_derivadas = await detallePreciosApi.importarUnidadesDerivadas(
                  Array.from(preUnidadesDerivadas).map(name => ({
                    name,
                  }))
                )
                if (unidades_derivadas.error || !unidades_derivadas.data)
                  throw new Error(unidades_derivadas.error?.message || 'No se encontraron unidades derivadas')

                // Filtrar solo los productos que se encontraron
                const newData = data
                  .filter(item => {
                    const productoEncontrado = response.data!.data.find(
                      ({ cod_producto }) => cod_producto === `${item['Cod. Producto']}`
                    );
                    return !!productoEncontrado;
                  })
                  .map(item => {
                    const baseData: Record<string, unknown> = {
                      producto_almacen: {
                        connect: {
                          id: response.data!.data.find(
                            ({ cod_producto }) =>
                              cod_producto === `${item['Cod. Producto']}`
                          )?.producto_almacen_id,
                        },
                      },
                      unidad_derivada: {
                        connect: {
                          id: unidades_derivadas.data!.data.find(
                            ({ name }) => name === item['Formato']
                          )?.id,
                        },
                      },
                      factor: Number(item['Factor']) || 1,
                      precio_publico: Number(item['P. Público']) || 0,
                    };

                    // Solo agregar campos opcionales si tienen valor
                    if (item['Comisión P. Público'] !== undefined && item['Comisión P. Público'] !== null && item['Comisión P. Público'] !== '') {
                      baseData.comision_publico = Number(item['Comisión P. Público']);
                    }
                    if (item['P. Especial'] !== undefined && item['P. Especial'] !== null && item['P. Especial'] !== '') {
                      baseData.precio_especial = Number(item['P. Especial']);
                    }
                    if (item['Comisión P. Especial'] !== undefined && item['Comisión P. Especial'] !== null && item['Comisión P. Especial'] !== '') {
                      baseData.comision_especial = Number(item['Comisión P. Especial']);
                    }
                    if (item['Activador P. Especial'] !== undefined && item['Activador P. Especial'] !== null && item['Activador P. Especial'] !== '') {
                      baseData.activador_especial = Number(item['Activador P. Especial']);
                    }
                    if (item['P. Mínimo'] !== undefined && item['P. Mínimo'] !== null && item['P. Mínimo'] !== '') {
                      baseData.precio_minimo = Number(item['P. Mínimo']);
                    }
                    if (item['Comisión P. Mínimo'] !== undefined && item['Comisión P. Mínimo'] !== null && item['Comisión P. Mínimo'] !== '') {
                      baseData.comision_minimo = Number(item['Comisión P. Mínimo']);
                    }
                    if (item['Activador P. Mínimo'] !== undefined && item['Activador P. Mínimo'] !== null && item['Activador P. Mínimo'] !== '') {
                      baseData.activador_minimo = Number(item['Activador P. Mínimo']);
                    }
                    if (item['P. Último'] !== undefined && item['P. Último'] !== null && item['P. Último'] !== '') {
                      baseData.precio_ultimo = Number(item['P. Último']);
                    }
                    if (item['Comisión P. Último'] !== undefined && item['Comisión P. Último'] !== null && item['Comisión P. Último'] !== '') {
                      baseData.comision_ultimo = Number(item['Comisión P. Último']);
                    }
                    if (item['Activador P. Último'] !== undefined && item['Activador P. Último'] !== null && item['Activador P. Último'] !== '') {
                      baseData.activador_ultimo = Number(item['Activador P. Último']);
                    }

                    return baseData;
                  })

                console.log('✅ Datos procesados para enviar:', newData);
                console.log('📊 Total de registros:', newData.length);
                console.log('📋 Primer registro procesado:', newData[0]);

                return newData
              }}
              propsUseServerMutation={{
                action: async (data: { data: Array<Record<string, unknown>> }) => {
                  console.log('📤 Enviando datos al backend:', data);
                  console.log('📊 Primer registro:', data.data[0]);
                  
                  const res = await detallePreciosApi.import(data as unknown as { data: ImportDetallePreciosItem[] });
                  
                  console.log('📥 Respuesta del backend:', res);
                  
                  if (res.error) {
                    console.error('❌ Error del backend:', res.error);
                    throw new Error(res.error.message);
                  }
                  return { data: res.data };
                },
                msgSuccess: 'Unidades Derivadas importadas exitosamente',
                onSuccess: () => setProductoSeleccionado(undefined),
                queryKey: [QueryKeys.PRODUCTOS],
              }}
            />
          )}
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
