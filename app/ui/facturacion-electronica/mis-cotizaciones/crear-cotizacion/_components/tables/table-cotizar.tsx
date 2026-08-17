'use client'

import TableWithTitle from '~/components/tables/table-with-title'
import { useColumnsCotizar, calcularSubtotalCotizacion } from './columns-cotizar'
import {
  useStoreProductoAgregadoCotizacion,
  ProductoCotizacionConUnidades,
} from '../../_store/store-producto-agregado-cotizacion'
import { useEffect, useRef, useCallback } from 'react'
import { AgGridReact } from 'ag-grid-react'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'

function condicionEditarProductoCotizacion({
  producto,
  item,
}: {
  producto: ProductoCotizacionConUnidades
  item: ProductoCotizacionConUnidades
}) {
  return (
    item.producto_id === producto.producto_id &&
    item.unidad_derivada_id === producto.unidad_derivada_id
  )
}

export default function TableCotizar() {
  const productoAgregado = useStoreProductoAgregadoCotizacion(
    (store) => store.productoAgregado
  )
  const setProductoAgregado = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductoAgregado
  )
  const carrito = useStoreProductoAgregadoCotizacion((store) => store.carrito)
  const setCarrito = useStoreProductoAgregadoCotizacion((store) => store.setCarrito)
  const productosStore = useStoreProductoAgregadoCotizacion(
    (store) => store.productos
  )
  const setProductosStore = useStoreProductoAgregadoCotizacion(
    (store) => store.setProductos
  )

  const agregarProducto = useCallback(
    ({ producto }: { producto: ProductoCotizacionConUnidades }) => {
      const subtotal = calcularSubtotalCotizacion({
        precio_venta: producto.precio_venta || 0,
        recargo: producto.recargo || 0,
        cantidad: producto.cantidad || 0,
        descuento: producto.descuento || 0,
        descuento_tipo: producto.descuento_tipo || 'Monto',
      })

      setCarrito((prev) => [...prev, { ...producto, subtotal: Number(subtotal) }])
    },
    [setCarrito]
  )

  useEffect(() => {
    if (productoAgregado && productoAgregado.producto_id) {
      // Ver nota de performance en handleOk (card-agregar-producto-venta.tsx).
      if (typeof window !== 'undefined') {
        console.timeLog('⏱️ agregar-producto', 'store → efecto TableCotizar')
      }
      // Agregar al catálogo si no existe
      if (
        !productosStore.find(
          (item) => item.producto_id === productoAgregado.producto_id
        )
      ) {
        setProductosStore((prev) => [...prev, productoAgregado])
      }

      // Leer el carrito SIEMPRE fresco (este efecto solo depende de
      // productoAgregado — mismo motivo que table-vender.tsx).
      const carritoActual = useStoreProductoAgregadoCotizacion.getState().carrito

      const producto_existente = carritoActual.find(
        (item) => item.producto_id === productoAgregado.producto_id
      )

      if (!producto_existente) {
        agregarProducto({ producto: productoAgregado })
        setProductoAgregado(undefined)
        return
      }

      const producto_unidad_derivada_existente = carritoActual.find((item) =>
        condicionEditarProductoCotizacion({
          producto: productoAgregado,
          item,
        })
      )

      if (producto_unidad_derivada_existente) {
        const nueva_cantidad =
          Number(productoAgregado.cantidad) +
          Number(producto_unidad_derivada_existente.cantidad)

        const nuevo_subtotal = calcularSubtotalCotizacion({
          precio_venta: productoAgregado.precio_venta || 0,
          recargo: productoAgregado.recargo || 0,
          cantidad: nueva_cantidad,
          descuento: productoAgregado.descuento || 0,
          descuento_tipo: productoAgregado.descuento_tipo || 'Monto',
        })

        setCarrito((prev) =>
          prev.map((item) =>
            condicionEditarProductoCotizacion({
              producto: productoAgregado,
              item,
            })
              ? {
                  ...productoAgregado,
                  // Conservar la identidad de la fila EXISTENTE — ver nota
                  // en table-vender.tsx sobre por qué esto es necesario.
                  _row_id: item._row_id,
                  cantidad: nueva_cantidad,
                  subtotal: Number(nuevo_subtotal),
                }
              : item
          )
        )
      } else {
        agregarProducto({ producto: productoAgregado })
      }

      setProductoAgregado(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregado])

  const agGridRef = useRef<AgGridReact>(null)

  // Medición de performance (mismo timer que arranca en handleOk de
  // card-agregar-producto-venta.tsx, compartido por ventas y cotizaciones):
  // cierra recién cuando la fila nueva aparece de verdad (carrito.length sube).
  // TODO: sacar junto con el resto de la instrumentación de ⏱️ agregar-producto.
  const prevCarritoLengthRef = useRef(carrito.length)
  useEffect(() => {
    if (typeof window !== 'undefined' && carrito.length > prevCarritoLengthRef.current) {
      console.timeEnd('⏱️ agregar-producto')
    }
    prevCarritoLengthRef.current = carrito.length
  }, [carrito.length])

  return (
    <>
      <CellFocusWithoutStyle />
      <TableWithTitle
        id="crear-cotizacion-productos-v2"
        title="Productos de Cotización"
        tableRef={agGridRef}
        className='h-full'
        rowHeight={56}
        rowSelection={false}
        // Identidad estable de fila independiente de índice — ver nota en
        // table-vender.tsx. `_row_id` se genera una sola vez por fila (ver
        // store-producto-agregado-cotizacion.ts / generarRowId reusado de venta).
        getRowId={(params) => String(params.data?._row_id)}
        rowData={carrito as any}
        columnDefs={useColumnsCotizar()}
        suppressCellFocus={true}
      />
    </>
  )
}
