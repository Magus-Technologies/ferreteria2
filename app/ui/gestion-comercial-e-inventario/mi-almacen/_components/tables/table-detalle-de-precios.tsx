'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsDetalleDePrecios } from './columns-detalle-de-precios'
import { QueryKeys } from '~/app/_lib/queryKeys'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputImport from '~/app/_components/form/inputs/input-import'
import { useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/types/zod-schemas'
import { detallePreciosApi, ImportDetallePreciosItem } from '~/lib/api/detalle-precios'
import { useQueryClient } from '@tanstack/react-query'
import ButtonBase from '~/components/buttons/button-base'
import ActionButtonsWrapper from '../others/action-buttons-wrapper'
import { useStoreFiltrosProductos } from '../../_store/store-filtros-productos'
import { useProductosInfiniteScroll } from '../../_hooks/useProductosInfiniteScroll'
import { greenColors } from '~/lib/colors'

export default function TableDetalleDePrecios() {
  const tableRef = useRef<AgGridReact>(null)
  const { can } = usePermissionHook()

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

  // Reutilizar el mismo hook y queryKey que la tabla principal para evitar peticiones duplicadas
  const {
    data: productosData,
    refetch,
  } = useProductosInfiniteScroll({
    filtros: {
      ...filtros,
      almacen_id: filtros?.almacen_id || almacen_id || 1,
    },
    enabled: !!filtros?.almacen_id,
    perPage: 1000,
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
          <span>
            de{' '}
            <span className='italic text-blue-900'>
              {primeraData < 1
                ? '-'
                : productoSeleccionado
                ? productoSeleccionado.name
                : 'TODOS LOS PRODUCTOS FILTRADOS'}
            </span>
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
                      precio_publico: Number(item['P. Público'] ?? item['Precio Público']) || 0,
                    };

                    // Mapeo dinámico para campos opcionales
                    // Soporta ambos formatos: "P. Especial" (Excel) y "Precio Especial" (legacy)
                    const optionalFields = {
                      comision_publico: ['Comisión P. Público', 'Comisión Precio Público'],
                      precio_especial: ['P. Especial', 'Precio Especial'],
                      comision_especial: ['Comisión P. Especial', 'Comisión Precio Especial'],
                      activador_especial: ['Activador P. Especial', 'Activador Precio Especial'],
                      precio_minimo: ['P. Mínimo', 'Precio Mínimo'],
                      comision_minimo: ['Comisión P. Mínimo', 'Comisión Precio Mínimo'],
                      activador_minimo: ['Activador P. Mínimo', 'Activador Precio Mínimo'],
                      precio_ultimo: ['P. Último', 'Precio Último'],
                      comision_ultimo: ['Comisión P. Último', 'Comisión Precio Último'],
                      activador_ultimo: ['Activador P. Último', 'Activador Precio Último'],
                    };

                    Object.entries(optionalFields).forEach(([apiKey, excelKeys]) => {
                      for (const excelKey of excelKeys) {
                        if (item[excelKey] !== undefined && item[excelKey] !== null && item[excelKey] !== '') {
                          row[apiKey] = Number(item[excelKey]);
                          break;
                        }
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
                  // Invalidar el caché de React Query para que refetch traiga datos frescos del backend
                  await queryClient.invalidateQueries({
                    queryKey: ['productos-infinite']
                  });

                  // Refrescar los datos después de invalidar
                  await refetch();

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
          columns: ['#', 'Formato', 'Factor', 'P. Compra', '% Venta', 'Precio Público', 'Ganancia', 'Precio Especial', 'Precio Mínimo', 'Precio Último'],
        },
        ...(can(permissions.PRODUCTO_IMPORT)
          ? [{
                color: 'warning' as const,
                label: 'Importación',
                columns: [
                  'Cod. Producto', 'Producto', 'Formato', 'Factor', 'Precio Público', 
                  'Comisión Precio Público', 'Precio Especial', 'Comisión Precio Especial', 
                  'Activador Precio Especial', 'Precio Mínimo', 'Comisión Precio Mínimo', 
                  'Activador Precio Mínimo', 'Precio Último', 'Comisión Precio Último', 'Activador Precio Último'
                ],
            }]
          : []),
      ]}
      rowData={rowData ?? []}
    />
  )
}
