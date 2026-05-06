'use client'

import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreEntregaSeleccionada } from './table-mis-entregas'
import { orangeColors } from '~/lib/colors'
import { formatFechaPeru } from '~/utils/fechas'

type DetalleProductoEntrega = {
  producto: string
  codigo: string
  marca: string
  unidad: string
  /** Total que se vendió en la venta original. */
  total: number
  /** Cantidad entregada en ESTA entrega. */
  entregado: number
  /** Cantidad que aún queda por entregar (vendido − entregado en todas las entregas). */
  pendiente: number
}

/** Producto del snapshot `datos_anteriores` (último VentaHistorial.accion='edicion'). */
type ProductoAnterior = {
  codigo: string
  producto: string
  unidad: string
  cantidad: number
  precio: number
}

export default function TableDetalleEntrega() {
  const entregaSeleccionada = useStoreEntregaSeleccionada(state => state.entrega)

  const venta = entregaSeleccionada?.venta
  const cliente = venta?.cliente
  const entregaFueEntregadaAntes = Boolean(
    (entregaSeleccionada as any)?.user_entregado_id ||
    (entregaSeleccionada as any)?.userEntregado?.id,
  )

  const clienteNombre = cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() ||
    'SIN CLIENTE'

  // Productos anteriores — extraídos del último registro de `venta.historial`
  // con `accion='edicion'`. Si la venta fue editada, mostramos los productos
  // que estaban antes del cambio (intercambiados o eliminados) tachados
  // como referencia para el chofer/operador.
  const ultimaEdicion = entregaFueEntregadaAntes
    ? (venta as any)?.historial?.find?.((h: any) => h.accion === 'edicion')
    : undefined
  const fechaUltimaEdicion = ultimaEdicion?.fecha
  const productosAnteriores: ProductoAnterior[] =
    (ultimaEdicion?.datos_anteriores?.productos || [])
      .flatMap((p: any) =>
        (p?.unidades || []).map((ud: any) => ({
          codigo: p?.codigo || '',
          producto: p?.nombre || '—',
          unidad: ud?.unidad || '',
          cantidad: Number(ud?.cantidad ?? 0),
          precio: Number(ud?.precio ?? 0),
        })),
      ) as ProductoAnterior[]

  const columnDefsAnteriores: ColDef<ProductoAnterior>[] = [
    { headerName: 'Código', field: 'codigo', width: 120 },
    { headerName: 'Producto', field: 'producto', flex: 1 },
    { headerName: 'U.Medida', field: 'unidad', width: 120 },
    {
      headerName: 'Cantidad',
      field: 'cantidad',
      width: 100,
      valueFormatter: (p) => Number(p.value).toFixed(2),
    },
    {
      headerName: 'Precio',
      field: 'precio',
      width: 100,
      valueFormatter: (p) => Number(p.value).toFixed(2),
    },
  ]

  const detalleProductos: DetalleProductoEntrega[] =
    (entregaSeleccionada as any)?.productos_entregados?.map((d: any) => {
      const ud = d.unidad_derivada_venta || {}
      const total = Number(ud.cantidad ?? 0)
      const entregado = Number(d.cantidad_entregada ?? 0)
      // El backend mantiene `cantidad_pendiente` agregado (vendido menos
      // suma de cantidades entregadas en todas las entregas asociadas a
      // la unidad). Si no viene, lo derivamos del total y lo entregado en
      // esta entrega — es una aproximación válida para el display.
      const pendiente = ud.cantidad_pendiente != null
        ? Number(ud.cantidad_pendiente)
        : Math.max(0, total - entregado)
      return {
        producto: ud.producto_almacen_venta?.producto_almacen?.producto?.name || '—',
        codigo: ud.producto_almacen_venta?.producto_almacen?.producto?.cod_producto || '',
        marca: ud.producto_almacen_venta?.producto_almacen?.producto?.marca?.name || '—',
        unidad: ud.unidad_derivada_inmutable?.name || '',
        total,
        entregado,
        pendiente,
      }
    }) || []

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
      headerName: 'Total',
      field: 'total',
      width: 90,
      valueFormatter: params => Number(params.value).toFixed(0),
    },
    {
      headerName: 'Entregado',
      field: 'entregado',
      width: 110,
      valueFormatter: params => Number(params.value).toFixed(0),
      cellStyle: { color: '#16a34a', fontWeight: 'bold' },
    },
    {
      headerName: 'Pendiente',
      field: 'pendiente',
      width: 110,
      valueFormatter: params => Number(params.value).toFixed(0),
      cellStyle: (params) =>
        Number(params.value) > 0
          ? { color: '#d97706', fontWeight: 'bold' }
          : { color: '#94a3b8', fontWeight: 'normal' },
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

      {/* Producto anterior — si en la última edición se reemplazó un
          producto por otro, mostramos el anterior tachado para que el
          operador entienda el intercambio. */}
      {productosAnteriores.length > 0 && (
        <div className='mt-4'>
          <div className='flex items-center gap-2 mb-2 px-3 py-2 bg-amber-50 border-l-4 border-amber-500 rounded'>
            <span className='text-amber-700 font-bold text-sm'>🔄 CAMBIO DE PRODUCTO</span>
            {fechaUltimaEdicion && (
              <span className='text-amber-600 text-xs'>
                — {formatFechaPeru(fechaUltimaEdicion, 'DD/MM/YYYY hh:mm A')}
              </span>
            )}
            <span className='text-amber-600 text-xs ml-auto italic'>
              Producto anterior (reemplazado en la última edición)
            </span>
          </div>
          <div className='w-full min-h-[160px] h-[200px]'>
            <TableWithTitle<ProductoAnterior>
              id='detalle-entrega-anteriores'
              title='Producto Anterior'
              selectionColor={orangeColors[10]}
              columnDefs={columnDefsAnteriores}
              rowData={productosAnteriores}
            />
          </div>
        </div>
      )}
    </div>
  )
}
