'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreAlmacen } from '~/store/store-almacen'
import { ProductoAlmacenUnidadDerivadaCreateInputSchema } from '~/prisma/generated/zod'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import { useColumnsDetalleDePrecios, DetalleDePreciosProps } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-detalle-de-precios'
import { CostoUnidadDerivadaSearch } from '../modals/modal-producto-search'
import ModalEditarPreciosProducto from '../modals/modal-editar-precios-producto'
import { GetRowIdParams, RowDoubleClickedEvent, ColumnResizedEvent } from 'ag-grid-community'
import { usePathname } from 'next/navigation'
import { orangeColors, greenColors } from '~/lib/colors'
import type { AgGridReact } from 'ag-grid-react'

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
  
  const gridRef = useRef<AgGridReact<DetalleDePreciosProps>>(null)
  const STORAGE_KEY = 'detalle-precios-column-state'

  const pathname = usePathname()
  // Detectar color según la ruta
  const colorSeleccion = pathname?.includes('facturacion-electronica') 
    ? orangeColors[10] 
    : pathname?.includes('gestion-comercial-e-inventario')
    ? greenColors[10]
    : undefined

  // Guardar estado de columnas cuando se redimensionan
  const handleColumnResized = useCallback((event: ColumnResizedEvent) => {
    if (event.finished && gridRef.current) {
      const columnState = gridRef.current.api.getColumnState()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnState))
    }
  }, [])

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

  // Restaurar estado de columnas al montar o cuando cambien los datos
  useEffect(() => {
    if (gridRef.current && gridRef.current.api) {
      const savedState = localStorage.getItem(STORAGE_KEY)
      if (savedState) {
        try {
          const columnState = JSON.parse(savedState)
          gridRef.current.api.applyColumnState({ state: columnState, applyOrder: true })
        } catch (error) {
          console.error('Error al restaurar estado de columnas:', error)
        }
      }
    }
  }, [rowData])

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

  // Identificar cada fila por su unidad_derivada.id para mantener la selección
  const getRowId = useCallback((params: GetRowIdParams<DetalleDePreciosProps>) => {
    return String(params.data.unidad_derivada?.id || params.data.id)
  }, [])

  return (
    <>
      <TableWithTitle
        ref={gridRef}
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
        selectionColor={colorSeleccion}
        getRowId={getRowId}
        onColumnResized={handleColumnResized}
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
