'use client'

import { useMemo } from 'react'
import { ColDef } from 'ag-grid-community'
import TableWithTitle from '~/components/tables/table-with-title'
import { useStoreEntregaSeleccionada } from './table-mis-entregas'
import { orangeColors } from '~/lib/colors'
import {
  getResumenProductosParcialAgrupado,
  isEntregaParcialAgrupada,
} from '../../_lib/entregas-parciales'

type DetalleProductoEntrega = {
  producto: string
  codigo: string
  marca: string
  unidad: string
  total: number
  recibido: number
  estaEntrega: number
  programado: number
  entregado: number
  pendiente: number
}

type ProductoFila = {
  codigo: string
  producto: string
  marca: string
  unidad: string
  cantidad: number
  cantidadPendiente: number
}

type ProductoHistorial = {
  codigo: string
  producto: string
  unidad: string
  cantidad: number
}

export default function TableDetalleEntrega() {
  const entregaSeleccionada = useStoreEntregaSeleccionada((state) => state.entrega)
  const esParcialAgrupada = isEntregaParcialAgrupada(entregaSeleccionada)

  const venta = entregaSeleccionada?.venta
  const cliente = venta?.cliente
  const direccionSeleccionada = venta?.direccion_seleccionada
  const entregaFueEntregadaAntes = Boolean(
    (entregaSeleccionada as any)?.user_entregado_id ||
    (entregaSeleccionada as any)?.userEntregado?.id,
  )
  const entregaTieneEntregaFisica =
    entregaSeleccionada?.estado_entrega === 'en' || entregaFueEntregadaAntes

  const clienteNombre =
    cliente?.razon_social ||
    `${cliente?.nombres || ''} ${cliente?.apellidos || ''}`.trim() ||
    'SIN CLIENTE'

  const direccionCliente = useMemo(() => {
    const direcciones = cliente?.direcciones || []
    if (!direcciones.length) return undefined
    return (
      direcciones.find((d: any) => d.tipo === direccionSeleccionada) ||
      direcciones.find((d: any) => d.es_principal) ||
      direcciones[0]
    )
  }, [cliente?.direcciones, direccionSeleccionada])

  const direccionMostrar =
    (entregaSeleccionada as any)?.direccion_entrega || direccionCliente?.direccion
  const referenciaMostrar =
    (entregaSeleccionada as any)?.referencia_entrega || direccionCliente?.referencia

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
        cantidadPendiente:
          ud.cantidad_pendiente == null ? 0 : Number(ud.cantidad_pendiente),
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

  const agruparProductos = <
    T extends {
      codigo: string
      unidad: string
      cantidad: number
      producto: string
      marca?: string
    },
  >(
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

  // Build a lookup: unidad_derivada_venta_id -> { entregado: number, programado: number }
  // aggregated from ALL sibling entregas of the same venta.
  const acumuladosPorUdv = useMemo(() => {
    const hermanas: any[] = (entregaSeleccionada as any)?.venta?.entregas_productos || []
    const selectedId = (entregaSeleccionada as any)?.id

    const mapa = new Map<string, { entregado: number; programado: number }>()

    for (const hermana of hermanas) {
      const estado = hermana.estado_entrega
      const esEntregada = estado === 'en'
      const esProgramada = estado === 'pe' || estado === 'ec'
      const esEstaEntrega = hermana.id === selectedId

      for (const detalle of hermana.productos_entregados || []) {
        const udvId: string = detalle.unidad_derivada_venta_id
        if (!udvId) continue
        const cantidad = Number(detalle.cantidad_entregada ?? 0)
        const entrada = mapa.get(udvId) ?? { entregado: 0, programado: 0 }

        if (esEntregada) {
          entrada.entregado += cantidad
        } else if (esProgramada && !esEstaEntrega) {
          // Only count OTHER pending/in-progress deliveries as "programado"
          entrada.programado += cantidad
        }

        mapa.set(udvId, entrada)
      }
    }

    return mapa
  }, [entregaSeleccionada])

  const detalleProductos = useMemo<DetalleProductoEntrega[]>(() => {
    if (esParcialAgrupada) {
      return getResumenProductosParcialAgrupado(entregaSeleccionada).map((producto) => ({
        producto: producto.producto,
        codigo: producto.codigo,
        marca: producto.marca,
        unidad: producto.unidad,
        total: producto.total,
        recibido: 0,
        estaEntrega: 0,
        programado: producto.programado,
        entregado: producto.entregado,
        pendiente: producto.pendiente,
      }))
    }

    // New entrega model: data arrives as `detalles` (EntregaDetalleItemResource).
    // Total = what THIS delivery was programmed for (entrega_detalle.cantidad),
    // NOT the full UDV quantity. Each delivery is self-contained.
    const rawProductosEntregados = (entregaSeleccionada as any)?.productos_entregados
    if (!rawProductosEntregados) {
      const detalles: any[] = (entregaSeleccionada as any)?.detalles || []
      const esConfirmada = (entregaSeleccionada as any)?.estado_entrega === 'en'
      return detalles.map((d) => {
        const estaEntregaQty = Number(d.cantidad ?? 0)
        return {
          producto: d.producto?.name || '—',
          codigo: d.producto?.cod_producto || '',
          marca: '—',
          unidad: d.unidad || '',
          total: estaEntregaQty,
          recibido: 0,
          estaEntrega: estaEntregaQty,
          programado: 0,
          entregado: esConfirmada ? estaEntregaQty : 0,
          pendiente: esConfirmada ? 0 : estaEntregaQty,
        } satisfies DetalleProductoEntrega
      })
    }

    if (!productosActuales.length) return []

    const actualesAgrupados = agruparProductos(productosActuales)

    if (!mostrarRecibido) {
      return [...actualesAgrupados.values()].map((producto) => {
        // Find the UDV id for this product row to look up cumulative totals
        const detalleActual = (entregaSeleccionada?.productos_entregados || []).find((detalle: any) => {
          const ud = detalle.unidad_derivada_venta || {}
          const prod = ud.producto_almacen_venta?.producto_almacen?.producto || {}
          const codigo = prod.cod_producto || ''
          const unidad = ud.unidad_derivada_inmutable?.name || ''
          return normalizarClave(codigo, unidad) === normalizarClave(producto.codigo, producto.unidad)
        })

        const udvId: string = detalleActual?.unidad_derivada_venta_id ?? ''
        const acumulado = acumuladosPorUdv.get(udvId)
        const programadoAcumulado = acumulado?.programado ?? 0
        const estaEntrega = Number(detalleActual?.cantidad_entregada ?? 0)

        // Total = what THIS delivery was programmed for, not the full sale qty.
        // Confirmed → entregado = estaEntrega, pendiente = 0.
        // Pending   → entregado = 0, pendiente = estaEntrega.
        const esConfirmada = (entregaSeleccionada as any)?.estado_entrega === 'en'
        const esCancelada = (entregaSeleccionada as any)?.estado_entrega === 'ca'
        const entregado = esConfirmada ? estaEntrega : 0
        const pendiente = (esConfirmada || esCancelada) ? 0 : estaEntrega

        return {
          producto: producto.producto,
          codigo: producto.codigo,
          marca: producto.marca || '—',
          unidad: producto.unidad,
          total: estaEntrega,
          recibido: esCancelada ? estaEntrega : 0,
          estaEntrega,
          programado: programadoAcumulado,
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
        total: Math.max(cantidadAnterior, cantidadActual),
        recibido: Math.max(cantidadAnterior - cantidadActual, 0),
        estaEntrega: 0,
        programado: 0,
        entregado: Math.min(cantidadAnterior, cantidadActual),
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
        estaEntrega: 0,
        programado: 0,
        entregado: 0,
        pendiente: 0,
      })
    }

    return filas
  }, [
    acumuladosPorUdv,
    entregaSeleccionada,
    esParcialAgrupada,
    mostrarRecibido,
    productosActuales,
    productosAnteriores,
  ])

  const columnDefs = useMemo<ColDef<DetalleProductoEntrega>[]>(() => {
    const mostrarProgramado = detalleProductos.some((p) => Number(p.programado || 0) > 0)

    const defs: ColDef<DetalleProductoEntrega>[] = [
      { headerName: 'Codigo', field: 'codigo', width: 120 },
      { headerName: 'Producto', field: 'producto', flex: 1 },
      { headerName: 'Marca', field: 'marca', width: 150 },
      { headerName: 'U.Medida', field: 'unidad', width: 120 },
      {
        headerName: 'Total',
        field: 'total',
        width: 90,
        valueFormatter: (params) => Number(params.value).toFixed(0),
      },
    ]

    defs.push({
      headerName: 'Recibido',
      field: 'recibido',
      width: 110,
      valueFormatter: (params) => Number(params.value).toFixed(0),
      cellStyle: (params) =>
        Number(params.value) > 0
          ? { color: '#b45309', fontWeight: 'bold' }
          : { color: '#94a3b8', fontWeight: 'normal' },
    })

    defs.push({
      headerName: 'Entregado',
      field: 'entregado',
      width: 115,
      valueFormatter: (params) => Number(params.value).toFixed(0),
      cellStyle: { color: '#16a34a', fontWeight: 'bold' },
      headerTooltip: 'Cantidad confirmada en esta entrega',
    })

    if (mostrarProgramado) {
      defs.push({
        headerName: 'Programado',
        field: 'programado',
        width: 110,
        valueFormatter: (params) => Number(params.value || 0).toFixed(0),
        cellStyle: (params) =>
          Number(params.value) > 0
            ? { color: '#2563eb', fontWeight: 'bold' }
            : { color: '#94a3b8', fontWeight: 'normal' },
        headerTooltip: 'Otras entregas pendientes/en camino para esta venta',
      })
    }

    defs.push({
      headerName: 'Pendiente',
      field: 'pendiente',
      width: 110,
      valueFormatter: (params) => Number(params.value).toFixed(0),
      cellStyle: (params) =>
        Number(params.value) > 0
          ? { color: '#d97706', fontWeight: 'bold' }
          : { color: '#94a3b8', fontWeight: 'normal' },
      headerTooltip: 'Cantidad programada en esta entrega aún sin confirmar',
    })

    return defs
  }, [detalleProductos, esParcialAgrupada, mostrarRecibido])

  return (
    <div className="w-full">
      {entregaSeleccionada && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mb-3">
          <div className="text-sm">
            <span className="font-semibold">Cliente: </span>
            <span>{clienteNombre}</span>
          </div>
          {cliente?.numero_documento && (
            <div className="text-sm">
              <span className="font-semibold">Doc: </span>
              <span>{cliente.numero_documento}</span>
            </div>
          )}
          {cliente?.telefono && (
            <div className="text-sm">
              <span className="font-semibold">Tel: </span>
              <span>{cliente.telefono}</span>
            </div>
          )}
          {direccionMostrar && (
            <div className="text-sm">
              <span className="font-semibold">Direccion: </span>
              <span>{direccionMostrar}</span>
            </div>
          )}
          {referenciaMostrar && (
            <div className="text-sm">
              <span className="font-semibold">Ref: </span>
              <span>{referenciaMostrar}</span>
            </div>
          )}
        </div>
      )}

      <div className="w-full min-h-[230px] h-[calc(100vh-600px)] max-h-[600px]">
        <TableWithTitle<DetalleProductoEntrega>
          id="detalle-entrega"
          title="Detalle de Entrega"
          selectionColor={orangeColors[10]}
          columnDefs={columnDefs}
          rowData={detalleProductos}
        />
      </div>
    </div>
  )
}
