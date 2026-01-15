'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreVentaSeleccionada } from './table-mis-ventas'
import { orangeColors } from '~/lib/colors'

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
    ventaSeleccionada?.productos_por_almacen.flatMap((productoAlmacen: any) =>
      productoAlmacen.unidades_derivadas.map((unidad: any) => ({
        producto: productoAlmacen.producto_almacen.producto.name,
        marca: productoAlmacen.producto_almacen.producto.marca.name,
        unidad: unidad.unidad_derivada_inmutable.name,
        cantidad: Number(unidad.cantidad),
        precio: Number(unidad.precio),
        subtotal:
          Number(unidad.cantidad) *
          Number(unidad.factor) *
          Number(unidad.precio),
      }))
    ) || []

  const columnDefs: ColDef<DetalleProducto>[] = [
    // Columna # comentada porque ya viene automáticamente en la tabla
    // {
    //   headerName: '#',
    //   valueGetter: 'node.rowIndex + 1',
    //   width: 60,
    // },
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

      {/* Tabla de detalle de venta */}
      <div className='w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[600px]'>
        <TableWithTitle<DetalleProducto>
          id='detalle-venta'
          title='Detalle de Venta'
          selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
          columnDefs={columnDefs}
          rowData={detalleProductos}
        />
      </div>
    </div>
  )
}
