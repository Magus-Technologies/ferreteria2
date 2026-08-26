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
  entregado: number
  pendiente: number
}

export default function TableDetalleVenta() {
  const ventaSeleccionada = useStoreVentaSeleccionada(state => state.venta)

  const filasProductos: DetalleProducto[] =
    ventaSeleccionada?.productos_por_almacen?.flatMap((productoAlmacen: any) =>
      productoAlmacen.unidades_derivadas.map((unidad: any) => ({
        producto: productoAlmacen.producto_almacen.producto.name,
        marca: productoAlmacen.producto_almacen.producto.marca.name,
        unidad: unidad.unidad_derivada_inmutable.name,
        cantidad: Number(unidad.cantidad),
        precio: Number(unidad.precio),
        subtotal: Number(unidad.cantidad) * Number(unidad.precio),
        entregado: Number(unidad.cantidad) - Number(unidad.cantidad_pendiente || 0),
        pendiente: Number(unidad.cantidad_pendiente || 0),
      }))
    ) || []

  // Servicios de la venta: también son parte del detalle (ya salían en el ticket
  // y en la boleta, pero faltaban acá). No pasan por el flujo de entrega, así que
  // van con pendiente 0.
  const filasServicios: DetalleProducto[] =
    (ventaSeleccionada as any)?.servicios_venta?.map((sv: any) => {
      const nombre = sv.servicio?.nombre ?? 'SERVICIO'
      const referencia = String(sv.referencia ?? '').trim()
      const cantidad = Number(sv.cantidad ?? 0)
      return {
        producto: referencia !== '' ? `${nombre} (${referencia})` : nombre,
        marca: '—',
        unidad: 'SERV',
        cantidad,
        precio: Number(sv.precio_unitario ?? 0),
        subtotal: Number(sv.subtotal ?? 0),
        entregado: cantidad,
        pendiente: 0,
      }
    }) || []

  const detalleProductos: DetalleProducto[] = [...filasProductos, ...filasServicios]

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
    {
      headerName: 'Entregado',
      field: 'entregado',
      width: 100,
      valueFormatter: params => Number(params.value).toFixed(2),
      cellStyle: params => ({
        color: Number(params.value) > 0 ? '#16a34a' : '#9ca3af',
        fontWeight: Number(params.value) > 0 ? '600' : '400',
      } as Record<string, string>),
    },
    {
      headerName: 'Pendiente',
      field: 'pendiente',
      width: 100,
      valueFormatter: params => Number(params.value).toFixed(2),
      cellStyle: params => ({
        color: Number(params.value) > 0 ? '#ea580c' : '#16a34a',
        fontWeight: Number(params.value) > 0 ? '700' : '400',
      } as Record<string, string>),
    },
  ]

  return (
    <div className='w-full'>
      {/* Tabla de detalle de venta */}
      <div className='w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[300px]'>
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
