'use client'

import { Tooltip, Image } from 'antd'
import { useMemo } from 'react'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import type { DescuentoTipo, TipoPrecio } from '../../_types/cotizacion.types'
import { FaTrash } from 'react-icons/fa'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import SelectUnidadDerivadaCotizacion from '../form/select-unidad-derivada-cotizacion'
import SelectTipoPrecioCotizacion from '../form/select-tipo-precio-cotizacion'
import {
  useStoreProductoAgregadoCotizacion,
  ProductoCotizacionConUnidades,
} from '../../_store/store-producto-agregado-cotizacion'
import { getStorageUrl } from '~/utils/upload'

export function calcularSubtotalCotizacion({
  precio_venta,
  recargo = 0,
  cantidad,
  descuento = 0,
  descuento_tipo,
}: {
  precio_venta: number
  recargo?: number
  cantidad: number
  descuento?: number
  descuento_tipo: DescuentoTipo
}) {
  const precioConRecargo = precio_venta + recargo
  const subtotalSinDescuento = precioConRecargo * cantidad

  if (descuento_tipo === 'Monto') {
    return (subtotalSinDescuento - descuento).toFixed(2)
  } else {
    const descuentoCalculado = (subtotalSinDescuento * descuento) / 100
    return (subtotalSinDescuento - descuentoCalculado).toFixed(2)
  }
}

// --- Helpers de lectura/escritura sobre el carrito (Zustand) ---
// Mismo patrón que columns-vender.tsx: leen SIEMPRE fresco vía .getState()
// para poder quedar fuera de las deps de `columns` (useMemo más abajo).

function calcularSubtotalDeFila(row: ProductoCotizacionConUnidades): number {
  return Number(
    calcularSubtotalCotizacion({
      precio_venta: Number(row.precio_venta ?? 0),
      recargo: Number(row.recargo ?? 0),
      cantidad: Number(row.cantidad ?? 0),
      descuento: Number(row.descuento ?? 0),
      descuento_tipo: row.descuento_tipo || 'Monto',
    })
  )
}

/** Aplica un patch a una fila del carrito por _row_id y recalcula su subtotal. */
function patchCarritoRow(rowId: string, patch: Partial<ProductoCotizacionConUnidades>) {
  useStoreProductoAgregadoCotizacion.getState().setCarrito((prev) =>
    prev.map((row) => {
      if (row._row_id !== rowId) return row
      const patched = { ...row, ...patch }
      return { ...patched, subtotal: calcularSubtotalDeFila(patched) }
    })
  )
}

function removeCarritoRow(rowId: string) {
  useStoreProductoAgregadoCotizacion
    .getState()
    .setCarrito((prev) => prev.filter((row) => row._row_id !== rowId))
}

function handleCantidadChange(rowId: string, nuevaCantidad: number | null) {
  patchCarritoRow(rowId, { cantidad: Number(nuevaCantidad ?? 0) })
  autoSeleccionarMejorPrecioCotizacion(rowId)
}

/**
 * Auto-selecciona el mejor tipo de precio según la cantidad y los activadores.
 * Espejo de autoSeleccionarMejorPrecio en columns-vender.tsx.
 */
function autoSeleccionarMejorPrecioCotizacion(rowId: string) {
  const row = useStoreProductoAgregadoCotizacion.getState().carrito.find((r) => r._row_id === rowId)
  if (!row) return

  const productoId = row.producto_id
  const unidadDerivadaId = row.unidad_derivada_id
  const cantidad = Number(row.cantidad ?? 0)
  const tipoPrecioActual = (row.tipo_precio || 'publico') as TipoPrecio

  const productosStore = useStoreProductoAgregadoCotizacion.getState().productos
  const productoEnStore = productosStore.find((p) => p.producto_id === productoId)
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []
  const ud = unidadesDerivadas.find((u) => u.unidad_derivada.id === unidadDerivadaId)
  if (!ud) return

  const activadores: Record<TipoPrecio, number> = {
    publico: 0,
    especial: Number((ud as any).activador_especial ?? 0),
    minimo: Number((ud as any).activador_minimo ?? 0),
    ultimo: Number((ud as any).activador_ultimo ?? 0),
  }

  const estaHabilitado = (tipo: TipoPrecio) => {
    const act = activadores[tipo]
    return act <= 0 || cantidad >= act
  }

  let mejor: TipoPrecio = 'publico'
  let mejorAct = 0
  for (const tipo of ['especial', 'minimo', 'ultimo'] as TipoPrecio[]) {
    if (estaHabilitado(tipo) && activadores[tipo] > mejorAct) {
      mejor = tipo
      mejorAct = activadores[tipo]
    }
  }

  if (!estaHabilitado(tipoPrecioActual)) {
    if (mejor !== tipoPrecioActual) aplicarPrecioCotizacion(rowId, mejor, ud)
    return
  }

  const activadorActual = activadores[tipoPrecioActual] ?? 0
  if (mejorAct > activadorActual) {
    aplicarPrecioCotizacion(rowId, mejor, ud)
  }
}

function aplicarPrecioCotizacion(rowId: string, tipo: TipoPrecio, ud: any) {
  const preciosMap: Record<TipoPrecio, { precio: string; comision: string }> = {
    publico: { precio: 'precio_publico', comision: 'comision_publico' },
    especial: { precio: 'precio_especial', comision: 'comision_especial' },
    minimo: { precio: 'precio_minimo', comision: 'comision_minimo' },
    ultimo: { precio: 'precio_ultimo', comision: 'comision_ultimo' },
  }
  const { precio: precioKey, comision: comisionKey } = preciosMap[tipo]
  const precio = Number(ud[precioKey] ?? 0)
  const comision = Number(ud[comisionKey] ?? 0)

  patchCarritoRow(rowId, { tipo_precio: tipo, precio_venta: precio, comision })
}

export function useColumnsCotizar(): ColDef<ProductoCotizacionConUnidades>[] {
  // `columns` se pasa como columnDefs a AG Grid. Memoizado con las
  // dependencias reales (mismo fix que columns-vender.tsx) — los
  // cellRenderers leen `params.data` (fresco en cada invocación de AG Grid)
  // en vez de cerrar sobre una variable del scope de render.
  return useMemo(() => [
    {
      colId: 'codigo',
      headerName: 'Código',
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => (
        <div className='flex items-center h-full'>
          <Tooltip classNames={{ body: 'text-center!' }} title={data?.producto_codigo}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {data?.producto_codigo}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      colId: 'descripcion',
      headerName: 'Descripción',
      flex: 1,
      minWidth: 200,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => (
        <div className='flex items-center h-full'>
          <Tooltip classNames={{ body: 'text-center!' }} title={data?.producto_name}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {data?.producto_name}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      headerName: 'Imagen',
      colId: 'imagen',
      width: 56,
      minWidth: 56,
      suppressNavigable: true,
      sortable: false,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => {
        const tipoFila = data?._tipo_fila
        const tipo = data?._tipo

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return <div className="flex items-center h-full justify-center text-slate-300 text-xs">—</div>
        }
        if (tipo === 'servicio') {
          return <div className="flex items-center h-full justify-center text-slate-300 text-xs">—</div>
        }

        const src = getStorageUrl(data?.img as string | null | undefined)
        const isPaqueteProducto = tipoFila === 'paquete_producto'

        return (
          <div className="flex items-center h-full justify-center">
            {src ? (
              <Image
                src={src}
                alt={data?.producto_name || 'Producto'}
                width={isPaqueteProducto ? 22 : 32}
                height={isPaqueteProducto ? 22 : 32}
                className={
                  (isPaqueteProducto ? 'h-[22px] w-[22px]' : 'h-8 w-8') +
                  ' rounded border border-slate-200 object-cover flex-shrink-0'
                }
                preview={{ mask: 'Ver' }}
              />
            ) : (
              <div
                className={
                  (isPaqueteProducto ? 'h-[22px] w-[22px] text-[8px]' : 'h-8 w-8 text-[10px]') +
                  ' flex items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 font-semibold text-slate-400'
                }
              >
                S/I
              </div>
            )}
          </div>
        )
      },
    },
    {
      colId: 'marca',
      headerName: 'Marca',
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => (
        <div className='flex items-center h-full'>
          <Tooltip classNames={{ body: 'text-center!' }} title={data?.marca_name}>
            <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
              {data?.marca_name}
            </div>
          </Tooltip>
        </div>
      ),
    },
    {
      colId: 'unidad_medida',
      headerName: 'U.Medida',
      width: 150,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) =>
        data ? (
          <div className='flex items-center h-full'>
            <SelectUnidadDerivadaCotizacion row={data} />
          </div>
        ) : null,
    },
    {
      colId: 'tipo_precio',
      headerName: 'Tipo Precio',
      width: 130,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) =>
        data ? (
          <div className='flex items-center h-full'>
            <SelectTipoPrecioCotizacion row={data} />
          </div>
        ) : null,
    },
    {
      colId: 'cantidad',
      headerName: 'Cant.',
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => {
        const cantidad = data?.cantidad
        const unidad_derivada_factor = data?.unidad_derivada_factor
        const stock_fraccion = data?.stock_fraccion

        const cantidadEnFraccion = Number(cantidad || 0) * Number(unidad_derivada_factor || 1)
        const stockDisponible = Number(stock_fraccion || 0)
        const stockEnUnidad = stockDisponible / Number(unidad_derivada_factor || 1)
        const stockInsuficiente = cantidadEnFraccion > stockDisponible

        return (
          <div className='flex flex-col justify-center w-full py-2'>
            <InputNumberBase
              size='small'
              value={cantidad}
              precision={2}
              min={0}
              onChange={(nuevaCantidad) => {
                if (data?._row_id) handleCantidadChange(data._row_id, nuevaCantidad as number | null)
              }}
            />
            {stockInsuficiente && cantidad && (
              <div className='text-red-600 text-[11px] mt-1 font-medium leading-tight'>
                ⚠️ Stock: {stockEnUnidad.toFixed(2)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      colId: 'precio',
      headerName: 'Precio',
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            prefix='S/. '
            size='small'
            value={data?.precio_venta}
            precision={4}
            min={0}
            readOnly
            variant='borderless'
          />
        </div>
      ),
    },
    {
      colId: 'recargo',
      headerName: 'Recargo',
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            prefix='S/. '
            size='small'
            value={data?.recargo}
            precision={4}
            min={0}
            onChange={(nuevoRecargo) => {
              if (data?._row_id) patchCarritoRow(data._row_id, { recargo: Number(nuevoRecargo ?? 0) })
            }}
          />
        </div>
      ),
    },
    {
      colId: 'descuento',
      headerName: 'Descuento',
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => {
        const descuento_tipo = data?.descuento_tipo || 'Monto'
        const isPorcentaje = descuento_tipo === 'Porcentaje'

        return (
          <div className='flex items-center h-full gap-1'>
            <SelectBase
              size='small'
              className='w-[60px]! min-w-[60px]! max-w-[60px]!'
              value={descuento_tipo}
              options={[
                { value: 'Monto', label: 'S/.' },
                { value: 'Porcentaje', label: '%' },
              ]}
              onChange={(nuevoTipo) => {
                if (data?._row_id) patchCarritoRow(data._row_id, { descuento_tipo: nuevoTipo as DescuentoTipo })
              }}
            />
            <InputNumberBase
              prefix={isPorcentaje ? undefined : 'S/. '}
              suffix={isPorcentaje ? '%' : undefined}
              size='small'
              className='w-full'
              value={data?.descuento}
              precision={isPorcentaje ? 2 : 4}
              min={0}
              max={isPorcentaje ? 100 : undefined}
              onChange={(nuevoDescuento) => {
                if (data?._row_id) patchCarritoRow(data._row_id, { descuento: Number(nuevoDescuento ?? 0) })
              }}
            />
          </div>
        )
      },
    },
    {
      colId: 'subtotal',
      headerName: 'Subtotal',
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => (
        <div className='flex items-center h-full'>
          <InputNumberBase
            size='small'
            value={data?.subtotal}
            prefix='S/. '
            precision={2}
            readOnly
            variant='borderless'
          />
        </div>
      ),
    },
    {
      colId: 'acciones',
      headerName: 'Acciones',
      width: 100,
      pinned: 'right',
      cellRenderer: ({ data }: ICellRendererParams<ProductoCotizacionConUnidades>) => (
        <button
          type='button'
          onClick={() => {
            if (data?._row_id) removeCarritoRow(data._row_id)
          }}
          className='text-red-600 hover:text-red-800 p-2'
        >
          <FaTrash />
        </button>
      ),
    },
  ], [])
}
