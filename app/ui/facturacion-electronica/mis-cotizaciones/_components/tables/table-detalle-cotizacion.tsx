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
    cotizacionSeleccionada?.productos_por_almacen.flatMap(productoAlmacen =>
      productoAlmacen.unidades_derivadas.map(unidad => ({
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
      }))
    ) || []

  const totalCotizacion = detalle.reduce((sum, item) => sum + item.subtotal, 0)

  const columns: ColDef<DetalleCotizacion>[] = [
    // {
    //   headerName: '#',
    //   valueGetter: 'node.rowIndex + 1',
    //   width: 50,
    // },
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
    <div className='w-full mt-4' style={{ height: '250px' }}>
      <TableWithTitle<DetalleCotizacion>
        id='detalle-cotizacion'
        title='DETALLE REGISTROS'
        columnDefs={columns}
        rowData={detalle}
      />
      
      {cotizacionSeleccionada && (
        <div className='mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200'>
          <div className='flex justify-between items-center'>
            <div>
              <h4 className='font-bold text-blue-900'>Resumen de proforma seleccionada</h4>
              <p className='text-sm text-gray-600'>
                Cliente: {cotizacionSeleccionada.cliente?.razon_social ||
                  `${cotizacionSeleccionada.cliente?.nombres || ''} ${
                    cotizacionSeleccionada.cliente?.apellidos || ''
                  }`.trim() || 'N/A'}
              </p>
            </div>
            <div className='text-right'>
              <p className='text-sm text-gray-600'>Total Proforma S/.</p>
              <p className='text-2xl font-bold text-blue-900'>
                {totalCotizacion.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
