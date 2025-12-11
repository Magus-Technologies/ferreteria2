'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreVentaSeleccionada } from './table-mis-ventas'

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
    ventaSeleccionada?.productos_por_almacen.flatMap(productoAlmacen =>
      productoAlmacen.unidades_derivadas.map(unidad => ({
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

  // Calcular totales
  const subtotal = detalleProductos.reduce((sum, p) => sum + p.subtotal, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

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
    <div className='mt-4 w-full'>
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

      {/* Tabla y Totales lado a lado */}
      <div className='flex gap-4 w-full'>
        {/* Tabla - ocupa la mayor parte */}
        <div className='flex-1 min-w-0' style={{ height: '400px' }}>
          <TableWithTitle<DetalleProducto>
            id='detalle-venta'
            title='Detalle de Venta'
            columnDefs={columnDefs}
            rowData={detalleProductos}
          />
        </div>

        {/* Totales al costado derecho */}
        <div className='w-[280px] bg-white border border-gray-200 rounded-lg p-3 h-fit'>
          <div className='space-y-1.5'>
            {/* Crédito/Contado/Pagado - Comentado temporalmente */}
            {/* <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='font-semibold text-red-600 text-sm'>Crédito</span>
              <span className='text-red-600 font-bold text-sm'>
                {ventaSeleccionada?.forma_de_pago === 'Crédito'
                  ? `S/. ${total.toFixed(2)}`
                  : 'S/. 0.00'}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='font-semibold text-orange-600 text-sm'>Contado</span>
              <span className='text-orange-600 font-bold text-sm'>
                {ventaSeleccionada?.forma_de_pago === 'Contado'
                  ? `S/. ${total.toFixed(2)}`
                  : 'S/. 0.00'}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='font-semibold text-green-600 text-sm'>Pagado</span>
              <span className='text-green-600 font-bold text-sm'>
                S/. {total.toFixed(2)}
              </span>
            </div> */}
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Vía contado:</span>
              <span className='font-semibold text-xs'>S/. {total.toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Anulados:</span>
              <span className='font-semibold text-xs'>S/. 0.00</span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Vía crédito:</span>
              <span className='font-semibold text-xs'>S/. 0.00</span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Crédito (Total Paga):</span>
              <span className='font-semibold text-xs'>S/. 0.00</span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Crédito (Deuda):</span>
              <span className='font-semibold text-xs'>S/. 0.00</span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Total ICBPER:</span>
              <span className='font-semibold text-xs'>S/. 0.00</span>
            </div>
            <div className='flex justify-between items-center py-2 border-t-2 border-gray-400'>
              <span className='font-bold text-base'>Total ventas:</span>
              <span className='font-bold text-base text-blue-600'>
                S/. {total.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Venta Promedio:</span>
              <span className='font-semibold text-xs'>S/. {total.toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center py-1.5'>
              <span className='text-xs'>Comisión:</span>
              <span className='font-semibold text-xs'>S/. 0.00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
