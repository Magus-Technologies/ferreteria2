import TableWithTitle from '~/components/tables/table-with-title'
import { FormInstance } from 'antd/lib'
import { useColumnsVender } from './columns-vender'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import CellFocusWithoutStyle from '~/components/tables/cell-focus-without-style'
// ModalDetallePaqueteVenta ya no se necesita - sub-productos se muestran inline
import {
  useStoreProductoAgregadoVenta,
  ValuesCardAgregarProductoVenta,
  generarRowId,
} from '../../_store/store-producto-agregado-venta'
import { useEffect, useMemo, useCallback, useRef } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { useConfigMode } from '~/app/ui/configuracion/permisos-visuales/_components/config-mode-context'
import { Grid } from 'antd'
import type { ValeCompra } from '~/lib/api/vales-compra'

function condicionEditarProductoVenta({
  producto,
  item,
}: {
  producto: ValuesCardAgregarProductoVenta
  item: ValuesCardAgregarProductoVenta
}) {
  // Nunca agrupar filas de paquete (cabecera o sub-producto) con nada
  if (producto._tipo_fila === 'paquete_cabecera' || producto._tipo_fila === 'paquete_producto') return false
  if (item._tipo_fila === 'paquete_cabecera' || item._tipo_fila === 'paquete_producto') return false

  // No agrupar si el item existente pertenece a un paquete y el nuevo no (o viceversa)
  // Solo agrupar si ambos tienen el mismo paquete_id (o ambos no tienen)
  if (item.paquete_id !== producto.paquete_id) return false

  return (
    item.producto_id === producto.producto_id &&
    item.unidad_derivada_id === producto.unidad_derivada_id
  )
}

export default function TableVender({
  form,
  cantidad_pendiente = false,
  venta,
}: {
  form: FormInstance
  cantidad_pendiente?: boolean
  venta?: VentaConUnidadDerivadaNormal
}) {
  const productoAgregadoVentaStore = useStoreProductoAgregadoVenta(
    (store) => store.productoAgregado
  )
  const carrito = useStoreProductoAgregadoVenta((store) => store.carrito)
  const setCarrito = useStoreProductoAgregadoVenta((store) => store.setCarrito)
  const productosVenta = useStoreProductoAgregadoVenta(
    (store) => store.productos
  )
  const setProductosVenta = useStoreProductoAgregadoVenta(
    (store) => store.setProductos
  )
  const valesAplicables = useStoreProductoAgregadoVenta(
    (store) => store.valesAplicables
  )

  // Inserta `producto` al final del carrito, salvo que ya haya filas de vale
  // promocional: en ese caso se inserta ANTES de la primera, para que los
  // vales siempre queden al final (aplican a toda la compra). La decisión de
  // dónde insertar se toma DENTRO del updater con `prev`, así siempre ve el
  // carrito más fresco (evita el mismo problema de closures obsoletas que ya
  // resolvía `form.getFieldValue` en la versión anterior de este archivo).
  const agregarProducto = useCallback(
    ({ producto }: { producto: ValuesCardAgregarProductoVenta }) => {
      const isPaqueteFila =
        producto._tipo_fila === 'paquete_cabecera' || producto._tipo_fila === 'paquete_producto'
      const nuevoItem = {
        ...producto,
        subtotal: isPaqueteFila
          ? Number(producto.subtotal ?? 0)
          : Number(
              (
                (Number(producto.precio_venta) + Number(producto.recargo ?? 0)) *
                Number(producto.cantidad)
              ).toFixed(2)
            ),
      }

      setCarrito((prev) => {
        if (producto._tipo_fila !== 'vale_promocional') {
          const primerValeIdx = prev.findIndex((p) => p._tipo_fila === 'vale_promocional')
          if (primerValeIdx >= 0) {
            const copia = [...prev]
            copia.splice(primerValeIdx, 0, nuevoItem)
            return copia
          }
        }
        return [...prev, nuevoItem]
      })
    },
    [setCarrito]
  )

  useEffect(() => {
    const productoAgregadoVenta = { ...productoAgregadoVentaStore }
    if (
      productoAgregadoVenta &&
      Object.keys(productoAgregadoVenta).length &&
      productoAgregadoVenta.producto_id
    ) {
      // Ver nota de performance en handleOk (card-agregar-producto-venta.tsx).
      if (typeof window !== 'undefined') {
        console.timeLog('⏱️ agregar-producto', 'store → efecto TableVender')
      }

      // Leer el carrito SIEMPRE fresco (este efecto solo depende de
      // productoAgregadoVentaStore — igual que antes se leía con
      // form.getFieldValue en vez de una variable cerrada sobre un render viejo).
      const carritoActual = useStoreProductoAgregadoVenta.getState().carrito

      // Sub-producto de paquete → saltar si ya existe en la tabla (evita duplicar al re-agregar el mismo paquete)
      if (productoAgregadoVenta._tipo_fila === 'paquete_producto') {
        const paqueteId = productoAgregadoVenta.paquete_id
        const alreadyExists = carritoActual.some(
          (p) =>
            p._tipo_fila === 'paquete_producto' &&
            p.paquete_id === paqueteId &&
            p.producto_id === productoAgregadoVenta.producto_id
        )
        if (alreadyExists) return
      }

      // Cabecera de paquete → si ya existe uno con el mismo paquete_id, incrementar cantidad
      if (productoAgregadoVenta._tipo_fila === 'paquete_cabecera') {
        const paqueteId = productoAgregadoVenta.paquete_id
        const cabIdx = carritoActual.findIndex(
          (p) => p._tipo_fila === 'paquete_cabecera' && p.paquete_id === paqueteId
        )

        if (cabIdx >= 0) {
          const subIdxs: number[] = []
          for (let pos = cabIdx + 1; pos < carritoActual.length; pos++) {
            if (carritoActual[pos]._tipo_fila !== 'paquete_producto') break
            subIdxs.push(pos)
          }

          const nuevaCantPaquete = Number(carritoActual[cabIdx].cantidad_paquete || 1) + 1

          let precioPaqueteUnit = 0
          for (const si of subIdxs) {
            precioPaqueteUnit +=
              (Number(carritoActual[si].precio_venta || 0) - Number(carritoActual[si].descuento || 0)) *
              Number(carritoActual[si].cantidad_base || 1)
          }

          const updates = [...carritoActual]
          for (const si of subIdxs) {
            const cantBase = Number(carritoActual[si].cantidad_base || 1)
            const nuevaCantSub = cantBase * nuevaCantPaquete
            updates[si] = {
              ...updates[si],
              cantidad: nuevaCantSub,
              subtotal:
                (Number(carritoActual[si].precio_venta || 0) - Number(carritoActual[si].descuento || 0)) *
                nuevaCantSub,
            }
          }
          updates[cabIdx] = {
            ...updates[cabIdx],
            cantidad_paquete: nuevaCantPaquete,
            cantidad: nuevaCantPaquete,
            precio_venta: precioPaqueteUnit,
            subtotal: precioPaqueteUnit * nuevaCantPaquete,
          }

          setCarrito(updates)
          return
        }
        // Sin existente → agregar normalmente (continúa el flujo)
      }

      // Los servicios siempre se agregan como filas nuevas (no se agrupan)
      if (productoAgregadoVenta._tipo === 'servicio') {
        agregarProducto({ producto: productoAgregadoVenta })
        return
      }

      if (
        !productosVenta.find(
          (item) => item.producto_id === productoAgregadoVenta.producto_id
        )
      )
        setProductosVenta((prev) => [...prev, productoAgregadoVenta])

      const producto_existente = carritoActual.find(
        (item) =>
          item.producto_id === productoAgregadoVenta.producto_id &&
          item.paquete_id === productoAgregadoVenta.paquete_id
      )
      if (!producto_existente) {
        agregarProducto({ producto: productoAgregadoVenta })
        return
      }

      const producto_unidad_derivada_existente = carritoActual.find((item) =>
        condicionEditarProductoVenta({
          producto: productoAgregadoVenta,
          item,
        })
      )
      if (producto_unidad_derivada_existente) {
        const nueva_cantidad =
          Number(productoAgregadoVenta.cantidad) +
          Number(producto_unidad_derivada_existente.cantidad)

        setCarrito((prev) =>
          prev.map((item) =>
            condicionEditarProductoVenta({
              producto: productoAgregadoVenta,
              item,
            })
              ? {
                  ...productoAgregadoVenta,
                  cantidad: nueva_cantidad,
                  subtotal: Number(
                    (
                      (Number(productoAgregadoVenta.precio_venta) +
                        Number(productoAgregadoVenta.recargo ?? 0)) *
                      Number(nueva_cantidad)
                    ).toFixed(2)
                  ),
                }
              : item
          )
        )
      } else {
        agregarProducto({ producto: productoAgregadoVenta })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoAgregadoVentaStore])

  // Helper para obtener beneficio del vale
  const getBeneficioVale = useCallback((vale: ValeCompra) => {
    if (vale.descuento_tipo === 'PORCENTAJE' && vale.descuento_valor)
      return `${vale.descuento_valor}% DSCTO`
    if (vale.descuento_tipo === 'MONTO_FIJO' && vale.descuento_valor)
      return `S/ ${Number(vale.descuento_valor).toFixed(2)} DSCTO`
    if (vale.tipo_promocion === 'PRODUCTO_GRATIS') return 'PRODUCTO GRATIS'
    if (vale.tipo_promocion === 'DOS_POR_UNO') return '2x1'
    return vale.tipo_promocion
  }, [])

  // Sincronizar vales aplicables como filas informativas en la tabla
  const prevValeIdsRef = useRef<string>('')
  useEffect(() => {
    const valeIds = valesAplicables.map(v => v.id).sort().join(',')
    if (valeIds === prevValeIdsRef.current) return
    prevValeIdsRef.current = valeIds

    const nuevasFilasVale = valesAplicables.map((vale) => ({
      _row_id: generarRowId(),
      _tipo_fila: 'vale_promocional' as const,
      producto_id: -vale.id,
      producto_name: `${vale.nombre} (${getBeneficioVale(vale)})`,
      producto_codigo: vale.codigo,
      marca_name: '',
      unidad_derivada_id: 0,
      unidad_derivada_name: '',
      unidad_derivada_factor: 1,
      cantidad: 1,
      precio_venta: 0,
      recargo: 0,
      descuento: 0,
      subtotal: 0,
    }))

    setCarrito((prev) => [
      ...prev.filter((p) => p._tipo_fila !== 'vale_promocional'),
      ...nuevasFilasVale,
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valesAplicables])

  // Detectar si estamos en modo configuración
  const configMode = useConfigMode()
  const screens = Grid.useBreakpoint()

  // Datos de demostración para modo configuración
  const demoProductos = useMemo(
    () =>
      [
        {
          producto_id: 1,
          producto_name: 'Cemento Portland Tipo I',
          producto_codigo: 'CEM-001',
          marca_name: 'Sol',
          unidad_derivada_id: 1,
          unidad_derivada_name: 'Bolsa',
          unidad_derivada_factor: 1,
          cantidad: 10,
          precio_venta: 28.5,
          recargo: 0,
          subtotal: 285.0,
        },
        {
          producto_id: 2,
          producto_name: 'Fierro Corrugado 1/2"',
          producto_codigo: 'FIE-002',
          marca_name: 'Aceros Arequipa',
          unidad_derivada_id: 2,
          unidad_derivada_name: 'Varilla',
          unidad_derivada_factor: 1,
          cantidad: 20,
          precio_venta: 35.0,
          recargo: 2.0,
          subtotal: 740.0,
        },
        {
          producto_id: 3,
          producto_name: 'Arena Gruesa',
          producto_codigo: 'ARE-003',
          marca_name: 'Agregados Perú',
          unidad_derivada_id: 3,
          unidad_derivada_name: 'M3',
          unidad_derivada_factor: 1,
          cantidad: 5,
          precio_venta: 80.0,
          recargo: 0,
          subtotal: 400.0,
        },
      ] as ValuesCardAgregarProductoVenta[],
    []
  )

  // Rellenar el carrito con productos de demo en modo configuración, una
  // sola vez (mientras esté vacío).
  useEffect(() => {
    if (configMode?.enabled && carrito.length === 0) {
      setCarrito(demoProductos.map((p) => ({ ...p, _row_id: generarRowId() })))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configMode?.enabled, carrito.length, demoProductos])

  // Medición de performance (ver handleOk en card-agregar-producto-venta.tsx):
  // cierra el timer recién cuando la fila nueva REALMENTE aparece en la tabla
  // (carrito.length sube), que es lo que el usuario percibe como "se agregó".
  // TODO: sacar junto con el resto de la instrumentación de ⏱️ agregar-producto.
  const prevCarritoLengthRef = useRef(carrito.length)
  useEffect(() => {
    if (typeof window !== 'undefined' && carrito.length > prevCarritoLengthRef.current) {
      console.timeEnd('⏱️ agregar-producto')
    }
    prevCarritoLengthRef.current = carrito.length
  }, [carrito.length])

  const { columns } = useColumnsVender({
    form,
    cantidad_pendiente,
    venta,
  })

  const agGridRef = useRef<AgGridReact>(null)

  return (
    <>
      <CellFocusWithoutStyle />
      <TableWithTitle
        id="crear-venta-productos"
        title="Productos de Venta"
        tableRef={agGridRef}
        columnDefs={columns}
        rowData={carrito as any}
        // Identidad estable de fila independiente de índice — antes la daba
        // `field.key` de Form.List (ver nota de performance histórica: sin
        // esto, cada producto agregado repintaba TODAS las filas existentes,
        // no solo la nueva). Ahora usa `_row_id`, generado una sola vez por
        // fila en el momento en que se crea (ver store-producto-agregado-venta.ts).
        getRowId={(params) => String(params.data?._row_id)}
        // Reemplaza wrapText+autoHeight de las columnas Producto/Cantidad (ver
        // columns-vender.tsx): altura fija con lugar para 2 líneas, en vez de
        // que AG Grid mida cada fila contra el DOM en cada actualización.
        rowHeight={56}
        rowSelection={false}
        suppressCellFocus={true}
        withNumberColumn={false}
        domLayout={configMode?.enabled ? 'normal' : screens.xl ? undefined : 'autoHeight'}
        getRowStyle={(params) => {
          const tipoFila = params.data?._tipo_fila
          if (tipoFila === 'paquete_cabecera') {
            return { background: '#fffbeb', borderLeft: '3px solid #f59e0b' }
          }
          if (tipoFila === 'paquete_producto') {
            return { background: '#f3f4f6', borderLeft: '3px solid #d1d5db' }
          }
          if (tipoFila === 'vale_promocional') {
            return { background: '#f0fdf4', borderLeft: '3px solid #22c55e' }
          }
          return undefined
        }}
      />
    </>
  )
}
