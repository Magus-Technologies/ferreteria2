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
import ActionButtonsWrapper from '../others/action-buttons-wrapper'
import { useProductosByAlmacen } from '../../_hooks/useProductosByAlmacen'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { greenColors } from '~/lib/colors'

export default function TableDetalleDePrecios() {
  const tableRef = useRef<AgGridReact>(null)
  const can = usePermission()

  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const filtros = useStoreFiltrosProductos((state) => state.filtros)
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

  // Usar el hook correcto para obtener productos
  const { data: productosData, refetch } = useProductosByAlmacen({
    filtros: {
      ...filtros,
      almacen_id: filtros?.almacen_id || almacen_id || 1,
      per_page: 10000, // NOTA: Se mantiene 10000 para detalle de precios porque necesita todos los productos con sus unidades derivadas
    },
    enabled: !!(filtros?.almacen_id || almacen_id),
  })

  const [primeraData, setPrimeraData] = useState(0)
  useEffect(() => {
    if (productosData && productosData.length > 0 && primeraData < 1) {
      setPrimeraData(prev => prev + 1)
    }
  }, [productosData, productoSeleccionado, primeraData])

  const productos_completos = productosData

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
      selectionColor={greenColors[10]} // Color verde para gestión comercial e inventario
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
            <ActionButtonsWrapper>
              <InputImport
              tableRef={tableRef}
              schema={ProductoAlmacenUnidadDerivadaCreateInputSchema}
              fieldsIgnored={[
                'producto_almacen.costo',
                'producto.cod_producto',
                'unidad_derivada.name',
                'producto.name',
              ]}
              // IMPORTANTE: Definir aquí todos los campos que construyes en preProcessData
              // para evitar que el componente los filtre y lleguen como undefined.
              columnasExtra={[
                { headerName: 'producto_almacen', field: 'producto_almacen' },
                { headerName: 'unidad_derivada', field: 'unidad_derivada' },
                { headerName: 'factor', field: 'factor' },
                { headerName: 'precio_publico', field: 'precio_publico' },
                { headerName: 'comision_publico', field: 'comision_publico' },
                { headerName: 'precio_especial', field: 'precio_especial' },
                { headerName: 'comision_especial', field: 'comision_especial' },
                { headerName: 'activador_especial', field: 'activador_especial' },
                { headerName: 'precio_minimo', field: 'precio_minimo' },
                { headerName: 'comision_minimo', field: 'comision_minimo' },
                { headerName: 'activador_minimo', field: 'activador_minimo' },
                { headerName: 'precio_ultimo', field: 'precio_ultimo' },
                { headerName: 'comision_ultimo', field: 'comision_ultimo' },
                { headerName: 'activador_ultimo', field: 'activador_ultimo' },
              ]}
              preProcessData={async data => {
                if (!almacen_id) throw new Error('No se selecciono un almacén')

                // Validar que existe el código de producto (permitir "0" como válido)
                if (data.some(item => item['Cod. Producto'] === undefined || item['Cod. Producto'] === null || item['Cod. Producto'] === ''))
                  throw new Error('Todas las Unidades Derivadas deben tener un Código de Producto')

                // Preparar datos para ambas llamadas
                const preResponse = new Set<string>(data.map(item => `${item['Cod. Producto']}`))
                const preUnidadesDerivadas = new Set<string>(data.map(item => `${item['Formato']}`))

                // OPTIMIZACIÓN: Ejecutar ambas llamadas API en paralelo en lugar de secuencial
                const [response, unidades_derivadas] = await Promise.all([
                  detallePreciosApi.getProductoAlmacenByCodProducto(
                    Array.from(preResponse).map(cod_producto => ({ cod_producto, almacen_id }))
                  ),
                  detallePreciosApi.importarUnidadesDerivadas(
                    Array.from(preUnidadesDerivadas).map(name => ({ name }))
                  )
                ])

                if (response.error || !response.data) {
                  throw new Error(response.error?.message || 'No se encontraron los Productos');
                }

                if (unidades_derivadas.error || !unidades_derivadas.data)
                  throw new Error('Error al procesar unidades derivadas')

                return data
                  .filter(item => response.data!.data.find(p => p.cod_producto === `${item['Cod. Producto']}`))
                  .map(item => {
                    const prodId = response.data!.data.find(p => p.cod_producto === `${item['Cod. Producto']}`)?.producto_almacen_id;
                    const unitId = unidades_derivadas.data!.data.find(u => u.name === item['Formato'])?.id;

                    const row: Record<string, any> = {
                      producto_almacen: { connect: { id: prodId } },
                      unidad_derivada: { connect: { id: unitId } },
                      // Aseguramos que los números no sean NaN
                      factor: Number(item['Factor']) || 1,
                      precio_publico: Number(item['P. Público']) || 0,
                    };

                    // Mapeo dinámico para campos opcionales
                    const optionalFields = {
                      comision_publico: 'Comisión P. Público',
                      precio_especial: 'P. Especial',
                      comision_especial: 'Comisión P. Especial',
                      activador_especial: 'Activador P. Especial',
                      precio_minimo: 'P. Mínimo',
                      comision_minimo: 'Comisión P. Mínimo',
                      activador_minimo: 'Activador P. Mínimo',
                      precio_ultimo: 'P. Último',
                      comision_ultimo: 'Comisión P. Último',
                      activador_ultimo: 'Activador P. Último',
                    };

                    Object.entries(optionalFields).forEach(([apiKey, excelKey]) => {
                      if (item[excelKey] !== undefined && item[excelKey] !== null && item[excelKey] !== '') {
                        row[apiKey] = Number(item[excelKey]);
                      }
                    });

                    return row;
                  })
              }}
              propsUseServerMutation={{
                action: async (payload: { data: Array<Record<string, unknown>> }) => {
                  // Aquí el payload.data ya debería contener los valores mapeados
                  const res = await detallePreciosApi.import(payload as any);
                  if (res.error) throw new Error(res.error.message);
                  return { data: res.data };
                },
                msgSuccess: 'Importación completada correctamente',
                onSuccess: async () => {
                  // OPTIMIZACIÓN: Refrescar inmediatamente los datos después del import
                  await refetch();

                  // También invalidar queries de productos por almacén
                  queryClient.invalidateQueries({
                    queryKey: ['productos-by-almacen']
                  });

                  setProductoSeleccionado(undefined);
                },
                queryKey: [QueryKeys.PRODUCTOS],
              }}
            />
            </ActionButtonsWrapper>
          )}
        </>
      }
      columnDefs={useColumnsDetalleDePrecios()}
      optionsSelectColumns={[
        {
          label: 'Default',
          columns: ['#', 'Formato', 'Factor', 'P. Compra', '% Venta', 'P. Público', 'Ganancia', 'P. Especial', 'P. Mínimo', 'P. Último'],
        },
        ...(can(permissions.PRODUCTO_IMPORT)
          ? [{
                color: 'warning' as const,
                label: 'Importación',
                columns: [
                  'Cod. Producto', 'Producto', 'Formato', 'Factor', 'P. Público', 
                  'Comisión P. Público', 'P. Especial', 'Comisión P. Especial', 
                  'Activador P. Especial', 'P. Mínimo', 'Comisión P. Mínimo', 
                  'Activador P. Mínimo', 'P. Último', 'Comisión P. Último', 'Activador P. Último'
                ],
            }]
          : []),
      ]}
      rowData={rowData ?? []}
    />
  )
}