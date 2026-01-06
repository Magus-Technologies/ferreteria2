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
      productoAlmacen.unidades_derivadas?.map(unidad => {
        const cantidad = Number(unidad.cantidad || 0);
        const precio = Number(unidad.precio || 0);
        const recargo = Number(unidad.recargo || 0);
        const descuento = Number(unidad.descuento || 0);
        
        // Calcular subtotal (igual que en ventas, SIN multiplicar por factor)
        const subtotalLinea = precio * cantidad;
        const subtotalConRecargo = subtotalLinea + recargo;
        
        // Aplicar descuento
        let subtotal = subtotalConRecargo;
        if (unidad.descuento_tipo === '%') {
          subtotal = subtotalConRecargo - (subtotalConRecargo * descuento / 100);
        } else {
          subtotal = subtotalConRecargo - descuento;
        }
        
        return {
          codigo: productoAlmacen.producto_almacen?.producto?.cod_producto || '',
          descripcion: productoAlmacen.producto_almacen?.producto?.name || '',
          marca: productoAlmacen.producto_almacen?.producto?.marca?.name || 'N/A',
          unidad_medida: unidad.unidad_derivada_inmutable?.name || '',
          cantidad: cantidad,
          precio: precio,
          subtotal: subtotal,
        };
      }) || []
    ) || []

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
    <div className='w-full'>
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
          <div className='text-sm'>
            <span className='font-semibold'>Estado: </span>
            <span>
              {cotizacionSeleccionada?.estado_cotizacion === 'pe' && 'Pendiente'}
              {cotizacionSeleccionada?.estado_cotizacion === 'co' && 'Confirmado'}
              {cotizacionSeleccionada?.estado_cotizacion === 've' && 'Vendido'}
              {cotizacionSeleccionada?.estado_cotizacion === 'ca' && 'Cancelado'}
            </span>
          </div>
          <div className='text-sm'>
            <span className='font-semibold'>Vigencia: </span>
            <span>{cotizacionSeleccionada?.vigencia_dias || 0} días</span>
          </div>
        </div>
      )}

      {/* Tabla de detalle de cotización */}
      <div className='w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[600px]'>
        <TableWithTitle<DetalleCotizacion>
          id='detalle-cotizacion'
          title='DETALLE REGISTROS'
          columnDefs={columns}
          rowData={detalle}
        />
      </div>
    </div>
  )
}

