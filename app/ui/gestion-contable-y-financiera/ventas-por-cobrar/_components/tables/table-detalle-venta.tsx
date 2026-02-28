'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { redColors } from '~/lib/colors'
import { useStoreVentaSeleccionada } from './table-ventas-por-cobrar'

type DetalleProducto = {
  producto: string
  marca: string
  unidad: string
  cantidad: number
  precio: number
  subtotal: number
}

export default function TableDetalleVenta() {
  const ventaSeleccionada = useStoreVentaSeleccionada(state => state.venta)

  const detalleProductos: DetalleProducto[] =
    ventaSeleccionada?.productos_por_almacen?.flatMap((productoAlmacen: any) => {
      // Validar que existan las propiedades necesarias
      if (!productoAlmacen?.producto_almacen?.producto || !productoAlmacen?.unidades_derivadas) {
        return []
      }
      
      return productoAlmacen.unidades_derivadas.map((unidad: any) => ({
        producto: productoAlmacen.producto_almacen.producto.name || 'Sin nombre',
        marca: productoAlmacen.producto_almacen.producto.marca?.name || 'Sin marca',
        unidad: unidad.unidad_derivada_inmutable?.name || 'Sin unidad',
        cantidad: Number(unidad.cantidad || 0),
        precio: Number(unidad.precio || 0),
        subtotal:
          Number(unidad.cantidad || 0) *
          Number(unidad.factor || 1) *
          Number(unidad.precio || 0),
      }))
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
      headerName: 'Precio',
      field: 'precio',
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
      {/* Info del cliente */}
      {ventaSeleccionada && (
        <div className='flex items-center gap-4 mb-3'>
          <div className='text-sm'>
            <span className='font-semibold'>Cliente: </span>
            <span>
              {ventaSeleccionada?.cliente?.razon_social ||
                `${ventaSeleccionada?.cliente?.nombres || ''} ${
                  ventaSeleccionada?.cliente?.apellidos || ''
                }`.trim() ||
                'CLIENTES VARIOS'}
            </span>
          </div>
          {ventaSeleccionada?.cliente?.email && (
            <div className='text-sm'>
              <span className='font-semibold'>Email: </span>
              <span>{ventaSeleccionada.cliente.email}</span>
            </div>
          )}
        </div>
      )}

      <TableWithTitle<DetalleProducto>
        id='table-detalle-venta-por-cobrar'
        title='Detalle de Venta'
        columnDefs={columnDefs}
        rowData={detalleProductos}
        selectionColor={redColors[1]}
        domLayout='autoHeight'
        suppressRowTransform={true}
      />
    </div>
  )
}
