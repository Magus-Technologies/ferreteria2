'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreCotizacionSeleccionada } from './table-mis-cotizaciones'
import { ColDef } from 'ag-grid-community'

type DetalleCotizacion = {
  codigo: string
  descripcion: string
  marca: string
  unidad_medida: string
  cantidad: number
  precio: number
  subtotal: number
}

export default function TableDetalleCotizacion() {
  const cotizacionSeleccionada = useStoreCotizacionSeleccionada(
    (state) => state.cotizacion
  )

  const detalle: DetalleCotizacion[] =
    cotizacionSeleccionada?.productos_por_almacen?.flatMap(productoAlmacen =>
      productoAlmacen.unidades_derivadas?.map(unidad => ({
        codigo: productoAlmacen.producto_almacen?.producto?.cod_producto || '',
        descripcion: productoAlmacen.producto_almacen?.producto?.name || '',
        marca: productoAlmacen.producto_almacen?.producto?.marca?.name || 'N/A',
        unidad_medida: unidad.unidad_derivada_inmutable?.name || '',
        cantidad: Number(unidad.cantidad || 0),
        precio: Number(unidad.precio || 0),
        subtotal:
          Number(unidad.cantidad || 0) *
          Number(unidad.factor || 1) *
          Number(unidad.precio || 0),
      })) || []
    ) || []

  const subtotal = detalle.reduce((sum, item) => sum + item.subtotal, 0)
  const totalDescuento = detalle.reduce((sum, item) => sum + 0, 0) // Por ahora 0, puedes agregar descuentos después
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
      {cotizacionSeleccionada && (
        <div className='flex items-center gap-4 mb-3'>
          <div className='text-sm'>
            <span className='font-semibold'>Cliente: </span>
            <span>
              {cotizacionSeleccionada?.cliente?.razon_social ||
                `${cotizacionSeleccionada?.cliente?.nombres || ''} ${
                  cotizacionSeleccionada?.cliente?.apellidos || ''
                }`.trim() ||
                'CLIENTE GENERAL'}
            </span>
          </div>
          {cotizacionSeleccionada?.cliente?.email && (
            <div className='text-sm'>
              <span className='font-semibold'>Email: </span>
              <span>{cotizacionSeleccionada.cliente.email}</span>
            </div>
          )}
        </div>
      )}

      {/* Tabla y Totales lado a lado */}
      <div className='flex gap-4 w-full'>
        {/* Tabla - ocupa la mayor parte */}
        <div className='flex-1 min-w-0' style={{ height: '400px' }}>
          <TableWithTitle<DetalleCotizacion>
            id='detalle-cotizacion'
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
              <span className='font-bold text-base'>Total Cotización:</span>
              <span className='font-bold text-base text-blue-600'>
                S/. {total.toFixed(2)}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Estado:</span>
              <span className='font-semibold text-xs'>
                {cotizacionSeleccionada?.estado_cotizacion === 'pe' && 'Pendiente'}
                {cotizacionSeleccionada?.estado_cotizacion === 'co' && 'Confirmado'}
                {cotizacionSeleccionada?.estado_cotizacion === 've' && 'Vendido'}
                {cotizacionSeleccionada?.estado_cotizacion === 'ca' && 'Cancelado'}
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5 border-b'>
              <span className='text-xs'>Vigencia:</span>
              <span className='font-semibold text-xs'>
                {cotizacionSeleccionada?.vigencia_dias || 0} días
              </span>
            </div>
            <div className='flex justify-between items-center py-1.5'>
              <span className='text-xs'>Stock Reservado:</span>
              <span className='font-semibold text-xs'>
                {cotizacionSeleccionada?.reservar_stock ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
