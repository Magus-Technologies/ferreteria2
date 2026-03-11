'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreEntregaSeleccionada } from './table-mis-entregas'
import { orangeColors } from '~/lib/colors'

type DetalleProductoEntrega = {
  producto: string
  codigo: string
  marca: string
  unidad: string
  cantidad: number
}

export default function TableDetalleEntrega() {
  const entregaSeleccionada = useStoreEntregaSeleccionada(state => state.entrega)

  const venta = entregaSeleccionada?.venta
  const cliente = venta?.cliente

  const clienteNombre = cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() ||
    'SIN CLIENTE'

  const detalleProductos: DetalleProductoEntrega[] =
    (entregaSeleccionada as any)?.productos_entregados?.map((d: any) => ({
      producto: d.unidad_derivada_venta?.producto_almacen_venta?.producto_almacen?.producto?.name || '—',
      codigo: d.unidad_derivada_venta?.producto_almacen_venta?.producto_almacen?.producto?.cod_producto || '',
      marca: d.unidad_derivada_venta?.producto_almacen_venta?.producto_almacen?.producto?.marca?.name || '—',
      unidad: d.unidad_derivada_venta?.unidad_derivada_inmutable?.name || '',
      cantidad: Number(d.cantidad_entregada),
    })) || []

  const columnDefs: ColDef<DetalleProductoEntrega>[] = [
    {
      headerName: 'Código',
      field: 'codigo',
      width: 120,
    },
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
      valueFormatter: params => Number(params.value).toFixed(0),
    },
  ]

  return (
    <div className='w-full'>
      {/* Info del cliente y entrega */}
      {entregaSeleccionada && (
        <div className='flex flex-wrap items-center gap-x-6 gap-y-1 mb-3'>
          <div className='text-sm'>
            <span className='font-semibold'>Cliente: </span>
            <span>{clienteNombre}</span>
          </div>
          {cliente?.numero_documento && (
            <div className='text-sm'>
              <span className='font-semibold'>Doc: </span>
              <span>{cliente.numero_documento}</span>
            </div>
          )}
          {cliente?.telefono && (
            <div className='text-sm'>
              <span className='font-semibold'>Tel: </span>
              <span>{cliente.telefono}</span>
            </div>
          )}
          {(entregaSeleccionada as any)?.direccion_entrega && (
            <div className='text-sm'>
              <span className='font-semibold'>Dirección: </span>
              <span>{(entregaSeleccionada as any).direccion_entrega}</span>
            </div>
          )}
        </div>
      )}

      {/* Tabla de detalle de entrega */}
      <div className='w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[600px]'>
        <TableWithTitle<DetalleProductoEntrega>
          id='detalle-entrega'
          title='Detalle de Entrega'
          selectionColor={orangeColors[10]}
          columnDefs={columnDefs}
          rowData={detalleProductos}
        />
      </div>
    </div>
  )
}
