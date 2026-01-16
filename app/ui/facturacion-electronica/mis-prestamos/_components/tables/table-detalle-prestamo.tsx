'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { UseStorePrestamoSeleccionada } from './table-mis-prestamos'
import { ColDef } from 'ag-grid-community'
import { orangeColors } from '~/lib/colors'
import { EstadoPrestamo, TipoOperacion } from '~/lib/api/prestamo'

type DetalleCotizacion = {
  codigo: string
  descripcion: string
  marca: string
  unidad_medida: string
  cantidad: number
}

export default function TableDetallePrestamo() {
  const prestamoSeleccionada = UseStorePrestamoSeleccionada(
    (state) => state.prestamo
  )

  // Laravel devuelve snake_case, no camelCase
  const productosPorAlmacen = (prestamoSeleccionada as any)?.productos_por_almacen

  const detalle: DetalleCotizacion[] =
    productosPorAlmacen?.flatMap((productoAlmacen: any) => {
      const unidades = productoAlmacen.unidades_derivadas
      const prodAlmacen = productoAlmacen.producto_almacen
      
      return unidades?.map((unidad: any) => ({
        codigo: prodAlmacen?.producto?.cod_producto || '',
        descripcion: prodAlmacen?.producto?.name || '',
        marca: prodAlmacen?.producto?.marca?.name || 'N/A',
        unidad_medida: unidad.name || '',
        cantidad: Number(unidad.cantidad || 0),
      })) || []
    }) || []

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
  ]

  return (
    <div className='w-full'>
      {/* Info del cliente/proveedor */}
      {prestamoSeleccionada && (
        <div className='flex items-center gap-4 mb-3'>
          <div className='text-sm'>
            <span className='font-semibold'>Cliente/Proveedor: </span>
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
          <div className='text-sm'>
            <span className='font-semibold'>Estado: </span>
            <span>
              {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.PENDIENTE && 'Pendiente'}
              {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.PAGADO_PARCIAL && 'Devuelto Parcial'}
              {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.PAGADO_TOTAL && 'Devuelto Total'}
              {prestamoSeleccionada?.estado_prestamo === EstadoPrestamo.VENCIDO && 'Vencido'}
            </span>
          </div>
          <div className='text-sm'>
            <span className='font-semibold'>Tipo: </span>
            <span>
              {prestamoSeleccionada?.tipo_operacion === TipoOperacion.PRESTAR && 'Prestado'}
              {prestamoSeleccionada?.tipo_operacion === TipoOperacion.PEDIR_PRESTADO && 'Emprestado'}
            </span>
          </div>
          <div className='text-sm'>
            <span className='font-semibold'>Moneda: </span>
            <span>{prestamoSeleccionada?.tipo_moneda === 's' ? 'Soles' : 'Dólares'}</span>
          </div>
        </div>
      )}

      {/* Tabla de detalle de préstamo */}
      <div className='w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[600px]'>
        <TableWithTitle<DetalleCotizacion>
          id='detalle-prestamo'
          title='DETALLE REGISTROS'
          selectionColor={orangeColors[10]} // Color naranja para facturación electrónica
          columnDefs={columns}
          rowData={detalle}
        />
      </div>
    </div>
  )
}
