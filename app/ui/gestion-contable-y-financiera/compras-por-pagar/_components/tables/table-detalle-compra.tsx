'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import { useStoreCompraSeleccionada } from './table-compras-por-pagar'

type DetalleProducto = {
  producto: string
  marca: string
  unidad: string
  cantidad: number
  costo: number
  flete: number
  subtotal: number
}

export default function TableDetalleCompra() {
  const compraSeleccionada = useStoreCompraSeleccionada(state => state.compra)

  const detalleProductos: DetalleProducto[] =
    compraSeleccionada?.productos_por_almacen?.flatMap((productoAlmacen: any) => {
      if (!productoAlmacen?.producto_almacen?.producto || !productoAlmacen?.unidades_derivadas) {
        return []
      }
      
      return productoAlmacen.unidades_derivadas.map((unidad: any) => {
        const cantidad = Number(unidad.cantidad || 0)
        const costo = Number(productoAlmacen.costo || 0)
        const factor = Number(unidad.factor ?? 1)
        const flete = Number(unidad.flete || 0)

        return {
          producto: productoAlmacen.producto_almacen.producto.name || 'Sin nombre',
          marca: productoAlmacen.producto_almacen.producto.marca?.name || 'Sin marca',
          unidad: unidad.unidad_derivada_inmutable?.name || 'Sin unidad',
          cantidad,
          costo,
          flete,
          // Subtotal con el FACTOR de la unidad derivada (igual que el backend)
          subtotal: (cantidad * costo * factor) + flete,
        }
      })
    }) || []

  const columnDefs: ColDef<DetalleProducto>[] = [
    {
      headerName: 'Producto',
      field: 'producto',
      flex: 1,
    },
    {
      headerName: 'Marca',
      field: 'marca',
      width: 150,
    },
    {
      headerName: 'U.Medida',
      field: 'unidad',
      width: 120,
    },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 100,
      valueFormatter: params => Number(params.value).toFixed(2),
    },
    {
      headerName: 'Costo',
      field: 'costo',
      width: 100,
      valueFormatter: params => `S/. ${Number(params.value).toFixed(2)}`,
    },
    {
      headerName: 'Flete',
      field: 'flete',
      width: 100,
      valueFormatter: params => `S/. ${Number(params.value).toFixed(2)}`,
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      width: 120,
      valueFormatter: params => `S/. ${Number(params.value).toFixed(2)}`,
    },
  ]

  return (
    <div className='w-full'>
      <TableWithTitle<DetalleProducto>
        id='table-detalle-compra-por-pagar'
        title='Detalle de Compra'
        columnDefs={columnDefs}
        rowData={detalleProductos}
        selectionColor={orangeColors[1]}
        domLayout='autoHeight'
        suppressRowTransform={true}
      />
    </div>
  )
}
