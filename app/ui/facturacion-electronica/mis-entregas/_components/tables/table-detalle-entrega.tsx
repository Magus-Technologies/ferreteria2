'use client'

import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreEntregaSeleccionada } from './table-mis-entregas'
import { orangeColors } from '~/lib/colors'

type DetalleProductoEntrega = {
  producto: string
  codigo: string
  marca: string
  unidad: string
  total: number
  recibido: number
  entregado: number
  pendiente: number
}

type ProductoFila = {
  codigo: string
  producto: string
  marca: string
  unidad: string
  cantidad: number
}

type ProductoHistorial = {
  codigo: string
  producto: string
  unidad: string
  cantidad: number
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

  const ultimaEdicion = useMemo(() => {
    if (!entregaFueEntregadaAntes) return undefined
    return (venta as any)?.historial?.find?.((h: any) => h.accion === 'edicion')
  }, [entregaFueEntregadaAntes, venta])

  const mostrarRecibido = entregaFueEntregadaAntes && Boolean(ultimaEdicion)

  const productosActuales = useMemo<ProductoFila[]>(() => {
    return ((entregaSeleccionada as any)?.productos_entregados || []).map((detalle: any) => {
      const ud = detalle.unidad_derivada_venta || {}
      const producto = ud.producto_almacen_venta?.producto_almacen?.producto || {}
      return {
        codigo: producto.cod_producto || '',
        producto: producto.name || '—',
        marca: producto.marca?.name || '—',
        unidad: ud.unidad_derivada_inmutable?.name || '',
        cantidad: Number(ud.cantidad ?? 0),
      }
    })
  }, [entregaSeleccionada])

  const productosAnteriores = useMemo<ProductoHistorial[]>(() => {
    return (ultimaEdicion?.datos_anteriores?.productos || []).flatMap((p: any) =>
      (p?.unidades || []).map((ud: any) => ({
        codigo: p?.codigo || '',
        producto: p?.nombre || '—',
        unidad: ud?.unidad || '',
        cantidad: Number(ud?.cantidad ?? 0),
      })),
    )
  }, [ultimaEdicion])

  const normalizarClave = (codigo: string, unidad: string) =>
    `${codigo}`.trim().toLowerCase() + '|' + `${unidad}`.trim().toLowerCase()

  const agruparProductos = <T extends { codigo: string; unidad: string; cantidad: number; producto: string; marca?: string }>(
    items: T[],
  ) => {
    const mapa = new Map<string, T & { cantidad: number }>()
    for (const item of items) {
      const clave = normalizarClave(item.codigo, item.unidad)
      const actual = mapa.get(clave)
      if (actual) {
        actual.cantidad += Number(item.cantidad ?? 0)
      } else {
        mapa.set(clave, {
          ...item,
          cantidad: Number(item.cantidad ?? 0),
        })
      }
    }
    return mapa
  }

  const detalleProductos = useMemo<DetalleProductoEntrega[]>(() => {
    if (!productosActuales.length) return []

    const actualesAgrupados = agruparProductos(productosActuales)
    if (!mostrarRecibido) {
      return [...actualesAgrupados.values()].map((producto) => {
        const total = Number(producto.cantidad ?? 0)
        const entregado = entregaSeleccionada?.estado_entrega === 'en' ? total : 0
        const pendiente = Math.max(0, total - entregado)
        return {
          producto: producto.producto,
          codigo: producto.codigo,
          marca: producto.marca || '—',
          unidad: producto.unidad,
          total,
          recibido: 0,
          entregado,
          pendiente,
        }
      })
    }

    const anterioresAgrupados = agruparProductos(
      productosAnteriores.map((p) => ({
        ...p,
        marca: '—',
      })),
    )

    const filas: DetalleProductoEntrega[] = []

    for (const [clave, actual] of actualesAgrupados.entries()) {
      const anterior = anterioresAgrupados.get(clave)
      const cantidadAnterior = Number(anterior?.cantidad ?? 0)
      const cantidadActual = Number(actual.cantidad ?? 0)

      filas.push({
        producto: actual.producto,
        codigo: actual.codigo,
        marca: actual.marca || '—',
        unidad: actual.unidad,
        total: cantidadActual,
        recibido: Math.max(cantidadAnterior - cantidadActual, 0),
        entregado: 0,
        pendiente: Math.max(cantidadActual - cantidadAnterior, 0),
      })
    }

    for (const [clave, anterior] of anterioresAgrupados.entries()) {
      if (actualesAgrupados.has(clave)) continue
      filas.push({
        producto: anterior.producto,
        codigo: anterior.codigo,
        marca: anterior.marca || '—',
        unidad: anterior.unidad,
        total: Number(anterior.cantidad ?? 0),
        recibido: Number(anterior.cantidad ?? 0),
        entregado: 0,
        pendiente: 0,
      })
    }

    return filas
  }, [entregaSeleccionada?.estado_entrega, mostrarRecibido, productosActuales, productosAnteriores])

  const columnDefs = useMemo<ColDef<DetalleProductoEntrega>[]>(() => {
    const defs: ColDef<DetalleProductoEntrega>[] = [
      { headerName: 'Codigo', field: 'codigo', width: 120 },
      { headerName: 'Producto', field: 'producto', flex: 1 },
      { headerName: 'Marca', field: 'marca', width: 150 },
      { headerName: 'U.Medida', field: 'unidad', width: 120 },
      {
        headerName: 'Total',
        field: 'total',
        width: 90,
        valueFormatter: params => Number(params.value).toFixed(0),
      },
    ]

    if (mostrarRecibido) {
      defs.push({
        headerName: 'Recibido',
        field: 'recibido',
        width: 110,
        valueFormatter: params => Number(params.value).toFixed(0),
        cellStyle: { color: '#b45309', fontWeight: 'bold' },
      })
    }

    defs.push(
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
    )

    return defs
  }, [mostrarRecibido])

  return (
    <div className='w-full'>
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
              <span className='font-semibold'>Direccion: </span>
              <span>{(entregaSeleccionada as any).direccion_entrega}</span>
            </div>
          )}
        </div>
      )}

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
