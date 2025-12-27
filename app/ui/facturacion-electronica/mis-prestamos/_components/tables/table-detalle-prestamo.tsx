'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { UseStorePrestamoSeleccionada } from './table-mis-prestamos'
import { ColDef } from 'ag-grid-community'
import { EstadoPrestamo, TipoOperacion } from '~/lib/api/prestamo'

type DetalleCotizacion = {
  codigo: string
  descripcion: string
  marca: string
  unidad_medida: string
  cantidad: number
  precio: number
  subtotal: number
}

export default function TableDetallePrestamo() {
  const prestamoSeleccionada = UseStorePrestamoSeleccionada(
    (state) => state.prestamo
  )

  const detalle: DetalleCotizacion[] =
    prestamoSeleccionada?.productosPorAlmacen?.flatMap(productoAlmacen =>
      productoAlmacen.unidadesDerivadas?.map(unidad => ({
        codigo: productoAlmacen.productoAlmacen?.producto?.codigo || '',
        descripcion: productoAlmacen.productoAlmacen?.producto?.descripcion || '',
        marca: productoAlmacen.productoAlmacen?.producto?.marca?.name || 'N/A',
        unidad_medida: unidad.name || '',
        cantidad: Number(unidad.cantidad || 0),
        precio: Number(productoAlmacen.costo || 0),
        subtotal:
          Number(unidad.cantidad || 0) *
          Number(unidad.factor || 1) *
          Number(productoAlmacen.costo || 0),
      })) || []
    ) || []

  const subtotal = detalle.reduce((sum: number, item: any) => sum + item.subtotal, 0)
  const totalDescuento = 0 // Por ahora 0, puedes agregar descuentos después
  const total = subtotal - totalDescuento

  const columns: ColDef<DetalleCotizacion>[] = [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 120,
    },
    {
      headerName: 'Descripción',
      field: 'descripcion',
      flex: 1,
      minWidth: 200,
    },
    {
      headerName: 'Marca',
      field: 'marca',
      width: 120,
    },
    {
      headerName: 'U.Medida',
      field: 'unidad_medida',
      width: 100,
    },
    {
      headerName: 'Cant.',
      field: 'cantidad',
      width: 80,
      valueFormatter: (params) => params.value?.toFixed(2),
    },
    {
      headerName: 'Precio',
      field: 'precio',
      width: 100,
      valueFormatter: (params) => `S/. ${params.value?.toFixed(2)}`,
    },
    {
      headerName: 'Subtotal',
      field: 'subtotal',
      width: 120,
      valueFormatter: (params) => `S/. ${params.value?.toFixed(2)}`,
    },
  ]

  return (
    <div className='mt-4 w-full'>
      {/* Info del cliente */}
      {prestamoSeleccionada && (
        <div className='flex items-center gap-4 mb-3'>
          <div className='text-sm'>
            <span className='font-semibold'>Cliente: </span>
            <span>
              {prestamoSeleccionada?.cliente?.razon_social ||
                `${prestamoSeleccionada?.cliente?.nombres || ''} ${
                  prestamoSeleccionada?.cliente?.apellidos || ''
                }`.trim() ||
                'CLIENTE GENERAL'}
            </span>
          </div>
          {prestamoSeleccionada?.cliente?.email && (
            <div className='text-sm'>
              <span className='font-semibold'>Email: </span>
              <span>{prestamoSeleccionada.cliente.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Tabla y Totales lado a lado */}
      <div className='flex gap-4 w-full'>
        {/* Tabla - ocupa la mayor parte */}
        <div className='flex-1 min-w-0' style={{ height: '400px' }}>
          <TableWithTitle<DetalleCotizacion>
            id='detalle-prestamo'
            title='DETALLE REGISTROS'
            columnDefs={columns}
            rowData={detalle}
          />
        </div>

        {/* Totales al costado derecho */}
        <div className='w-[280px] bg-white border border-gray-200 rounded-lg p-3 h-fit'>
          <div className='space-y-1.5'>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Subtotal:</span>
              <span className='font-semibold text-xs'>S/. {subtotal.toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Descuento:</span>
              <span className='font-semibold text-xs'>S/. {totalDescuento.toFixed(2)}</span>
            </div>
            <div className='flex justify-between items-center py-2 border-t-2 border-gray-400'>
              <span className='font-bold text-base'>Total Préstamo:</span>
              <span className='font-bold text-base text-blue-600'>
                S/. {total.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Estado:</span>
              <span className='font-semibold text-xs'>
                {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.PENDIENTE && 'Pendiente'}
                {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.PAGADO_PARCIAL && 'Pagado Parcial'}
                {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.PAGADO_TOTAL && 'Pagado Total'}
                {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.VENCIDO && 'Vencido'}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Tipo Operación:</span>
              <span className='font-semibold text-xs'>
                {prestamoSeleccionada?.tipo_operacion === TipoOperacion.PRESTAR && 'Prestar'}
                {prestamoSeleccionada?.tipo_operacion === TipoOperacion.PEDIR_PRESTADO && 'Pedir Prestado'}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5'>
              <span className='text-xs'>Moneda:</span>
              <span className='font-semibold text-xs'>
                {prestamoSeleccionada?.tipo_moneda === 's' ? 'Soles' : 'Dólares'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
