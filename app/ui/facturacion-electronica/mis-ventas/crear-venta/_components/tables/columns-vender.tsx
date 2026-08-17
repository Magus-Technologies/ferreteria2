'use client'

import { DescuentoTipo, TipoMoneda } from '~/lib/api/venta'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Form, FormInstance, Image, Tooltip, Popover } from 'antd'
import { useRef, useEffect, useState, useMemo } from 'react'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import SelectDescuentoTipo from '~/app/_components/form/selects/select-descuento-tipo'
import { MdDelete } from 'react-icons/md'
import SelectUnidadDerivadaVenta from '../form/select-unidad-derivada-venta'
import SelectTipoPrecioVenta from '../form/select-tipo-precio-venta'
import {
  useStoreProductoAgregadoVenta,
  ValuesCardAgregarProductoVenta,
} from '../../_store/store-producto-agregado-venta'
import { useStoreAlmacen } from '~/store/store-almacen'
import SelectBase from '~/app/_components/form/selects/select-base'
import { MdPriceChange } from 'react-icons/md'
import { PiWarehouseFill } from 'react-icons/pi'
import { GetStock } from '~/app/_utils/get-stock'
import { paqueteApi, type Paquete } from '~/lib/api/paquete'
import ModalBuscarPaquete from '~/app/_components/modals/modal-buscar-paquete'
import { calcularSubtotalVenta } from './calcular-subtotal-venta'
import { useStorePaqueteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-paquete-seleccionado'
import { getStorageUrl } from '~/utils/upload'

function PaquetesBadgeVenta({ productoId, count }: { productoId: number; count: number }) {
  const [open, setOpen] = useState(false)
  const [paquetes, setPaquetes] = useState<Paquete[]>([])
  const [loading, setLoading] = useState(false)
  const paqueteSeleccionado = useStorePaqueteSeleccionado(s => s.paquete)

  const handleClick = async () => {
    if (paquetes.length === 0) {
      setLoading(true)
      try {
        const res = await paqueteApi.getByProducto(productoId)
        setPaquetes((res.data as any)?.data ?? [])
      } finally {
        setLoading(false)
      }
    }
    setOpen(true)
  }

  return (
    <>
      <button
        type='button'
        onClick={handleClick}
        disabled={loading}
        className='flex items-center gap-1 text-[10px] text-amber-600 font-medium hover:text-amber-800 cursor-pointer bg-transparent border-none p-0'
      >
        🎁 {loading ? 'Cargando...' : `Disponible en ${count} paquete${count > 1 ? 's' : ''}`}
      </button>
      <ModalBuscarPaquete
        open={open}
        setOpen={setOpen}
        textDefault=''
        rowDataOverride={paquetes}
        onOk={() => setOpen(false)}
        onRowDoubleClicked={() => setOpen(false)}
      />
    </>
  )
}

const TIPO_PRECIO_PAQUETE_OPTIONS = [
  { value: 'publico', label: 'Público' },
  { value: 'especial', label: 'Ferretería' },
  { value: 'minimo', label: 'Mínimo' },
  { value: 'ultimo', label: 'Final' },
]

type TipoPrecio = 'publico' | 'especial' | 'minimo' | 'ultimo'

// --- Helpers de lectura/escritura sobre el carrito (Zustand) ---
// Todos leen el store SIEMPRE fresco vía .getState() en vez de cerrar sobre
// un valor de render viejo: las funciones de este archivo viven dentro de
// cellRenderers memoizados por `columns` (useMemo más abajo, con deps que
// NO incluyen el carrito a propósito — si dependiera de él, cada tecla
// tipeada reconstruiría columnDefs completo y AG Grid volvería a redibujar
// toda la tabla, el mismo problema de fondo que este refactor elimina).

function calcularSubtotalDeFila(row: ValuesCardAgregarProductoVenta): number {
  return calcularSubtotalVenta({
    precio_venta: Number(row.precio_venta ?? 0),
    recargo: Number(row.recargo ?? 0),
    descuento_tipo: row.descuento_tipo as DescuentoTipo,
    descuento: Number(row.descuento ?? 0),
    cantidad: Number(row.cantidad ?? 0),
  })
}

/** Aplica un patch a una fila del carrito por _row_id y recalcula su subtotal. */
function patchCarritoRow(rowId: string, patch: Partial<ValuesCardAgregarProductoVenta>) {
  useStoreProductoAgregadoVenta.getState().setCarrito((prev) =>
    prev.map((row) => {
      if (row._row_id !== rowId) return row
      const patched = { ...row, ...patch }
      return { ...patched, subtotal: calcularSubtotalDeFila(patched) }
    })
  )
}

function removeCarritoRow(rowId: string) {
  useStoreProductoAgregadoVenta.getState().setCarrito((prev) => prev.filter((row) => row._row_id !== rowId))
}

function removeCarritoPaquete(paqueteId: number) {
  useStoreProductoAgregadoVenta.getState().setCarrito((prev) => prev.filter((row) => row.paquete_id !== paqueteId))
}

function handleCantidadChange(rowId: string, nuevaCantidad: number | null) {
  patchCarritoRow(rowId, { cantidad: Number(nuevaCantidad ?? 0) })
  autoSeleccionarMejorPrecio(rowId)
}

/**
 * Auto-selecciona el mejor precio disponible según la cantidad.
 * "Mejor" = el tipo con el activador habilitado MÁS ALTO (tier más profundo desbloqueado).
 * Ejemplo: activador_minimo=4, activador_especial=5, activador_ultimo=10
 *   cantidad=4  → minimo (único habilitado)
 *   cantidad=5  → especial (activador 5 > 4)
 *   cantidad=10 → ultimo (activador 10 > 5 > 4)
 * Si la cantidad baja y el precio actual ya no es válido, elige el mejor disponible.
 * Solo auto-actualiza si el mejor disponible tiene un activador mayor que el actual.
 */
function autoSeleccionarMejorPrecio(rowId: string) {
  const row = useStoreProductoAgregadoVenta.getState().carrito.find((r) => r._row_id === rowId)
  if (!row) return

  const productoId = row.producto_id
  const unidadDerivadaId = row.unidad_derivada_id
  const cantidad = Number(row.cantidad ?? 0)
  const tipoPrecioActual = (row.tipo_precio || 'publico') as TipoPrecio

  const productosVentaStore = useStoreProductoAgregadoVenta.getState().productos
  const productoEnStore = productosVentaStore.find((p) => p.producto_id === productoId)
  const unidadesDerivadas = productoEnStore?.unidades_derivadas_disponibles || []
  const ud = unidadesDerivadas.find((u) => u.unidad_derivada.id === unidadDerivadaId)
  if (!ud) return

  const activadores: Record<TipoPrecio, number> = {
    publico: 0,
    especial: Number((ud as any).activador_especial ?? 0),
    minimo: Number((ud as any).activador_minimo ?? 0),
    ultimo: Number((ud as any).activador_ultimo ?? 0),
  }

  function estaHabilitado(tipo: TipoPrecio): boolean {
    const act = activadores[tipo]
    return act <= 0 || cantidad >= act
  }

  // Buscar el mejor tipo: el que tiene el activador MÁS ALTO entre los habilitados
  let mejor: TipoPrecio = 'publico'
  let mejorAct = 0
  for (const tipo of ['especial', 'minimo', 'ultimo'] as TipoPrecio[]) {
    if (estaHabilitado(tipo) && activadores[tipo] > mejorAct) {
      mejor = tipo
      mejorAct = activadores[tipo]
    }
  }

  // Si el actual ya no está habilitado (cantidad bajó), aplicar el mejor disponible
  if (!estaHabilitado(tipoPrecioActual)) {
    if (mejor !== tipoPrecioActual) {
      aplicarPrecio(rowId, mejor, ud)
    }
    return
  }

  // Solo auto-actualizar si el mejor tiene un activador mayor que el actual
  // (respeta selección manual a tier inferior mientras la cantidad no cambie hacia arriba)
  const activadorActual = activadores[tipoPrecioActual] ?? 0
  if (mejorAct > activadorActual) {
    aplicarPrecio(rowId, mejor, ud)
  }
}

function aplicarPrecio(rowId: string, tipo: TipoPrecio, ud: any) {
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

/** Recalcular sub-productos de la instancia de paquete cuya cabecera es cabeceraRowId. */
function recalcularSubProductosPaquete(cabeceraRowId: string, nuevaCantidadPaquete: number) {
  const carritoActual = useStoreProductoAgregadoVenta.getState().carrito
  const cabIdx = carritoActual.findIndex((r) => r._row_id === cabeceraRowId)
  if (cabIdx < 0) return

  const updates = [...carritoActual]
  let precioPaqueteUnitario = 0

  for (let i = cabIdx + 1; i < updates.length; i++) {
    if (updates[i]?._tipo_fila !== 'paquete_producto') break
    const cantidadBase = Number(updates[i].cantidad_base || 0)
    const precio = Number(updates[i].precio_venta || 0)
    const descuento = Number(updates[i].descuento || 0)
    precioPaqueteUnitario += (precio - descuento) * cantidadBase
  }

  for (let i = cabIdx + 1; i < updates.length; i++) {
    if (updates[i]?._tipo_fila !== 'paquete_producto') break
    const cantidadBase = Number(updates[i].cantidad_base || 0)
    const nuevaCantidad = cantidadBase * nuevaCantidadPaquete
    updates[i] = {
      ...updates[i],
      cantidad: nuevaCantidad,
      // Para sub-productos de paquete, descuento es POR UNIDAD (no total).
      subtotal: (Number(updates[i].precio_venta || 0) - Number(updates[i].descuento || 0)) * nuevaCantidad,
    }
  }

  updates[cabIdx] = {
    ...updates[cabIdx],
    cantidad_paquete: nuevaCantidadPaquete,
    cantidad: nuevaCantidadPaquete,
    precio_venta: precioPaqueteUnitario,
    subtotal: precioPaqueteUnitario * nuevaCantidadPaquete,
  }

  useStoreProductoAgregadoVenta.getState().setCarrito(updates)
}

/** Subtotales de los sub-productos de la instancia de paquete cuya cabecera es cabeceraRowId. */
function getPaqueteSubtotales(cabeceraRowId: string) {
  const carritoActual = useStoreProductoAgregadoVenta.getState().carrito
  const cabIdx = carritoActual.findIndex((r) => r._row_id === cabeceraRowId)
  if (cabIdx < 0) return 0
  let total = 0
  for (let i = cabIdx + 1; i < carritoActual.length; i++) {
    if (carritoActual[i]?._tipo_fila !== 'paquete_producto') break
    total += Number(carritoActual[i].subtotal || 0)
  }
  return total
}

function getPaqueteDescuentoTotal(cabeceraRowId: string) {
  const carritoActual = useStoreProductoAgregadoVenta.getState().carrito
  const cabIdx = carritoActual.findIndex((r) => r._row_id === cabeceraRowId)
  if (cabIdx < 0) return 0
  let total = 0
  for (let i = cabIdx + 1; i < carritoActual.length; i++) {
    if (carritoActual[i]?._tipo_fila !== 'paquete_producto') break
    total += Number(carritoActual[i].descuento || 0) * Number(carritoActual[i].cantidad || 0)
  }
  return total
}

function getPaquetePrecioBruto(cabeceraRowId: string) {
  const carritoActual = useStoreProductoAgregadoVenta.getState().carrito
  const cabIdx = carritoActual.findIndex((r) => r._row_id === cabeceraRowId)
  if (cabIdx < 0) return 0
  let total = 0
  for (let i = cabIdx + 1; i < carritoActual.length; i++) {
    if (carritoActual[i]?._tipo_fila !== 'paquete_producto') break
    total += Number(carritoActual[i].precio_venta || 0) * Number(carritoActual[i].cantidad || 0)
  }
  return total
}

/** Cambiar tipo de precio para la instancia de paquete cuya cabecera es cabeceraRowId. */
function cambiarTipoPrecioPaquete(
  cabeceraRowId: string,
  paqueteId: number,
  nuevoTipo: string,
  paqueteDiscountsRef: React.RefObject<Map<string, any>>
) {
  const carritoActual = useStoreProductoAgregadoVenta.getState().carrito
  const cabIdx = carritoActual.findIndex((r) => r._row_id === cabeceraRowId)
  if (cabIdx < 0) return

  const updates = [...carritoActual]
  // Leer el store SIEMPRE fresco (evita closures obsoletas en los
  // cellRenderers cacheados de AG Grid)
  const storeProductos = useStoreProductoAgregadoVenta.getState().productos as any[]
  let precioPaqueteUnitario = 0

  const cantidadPaquete = Number(updates[cabIdx]?.cantidad_paquete || 1)

  for (let i = cabIdx + 1; i < updates.length; i++) {
    if (updates[i]?._tipo_fila !== 'paquete_producto') break

    const key = `${paqueteId}_${updates[i].producto_id}`
    const discountData = paqueteDiscountsRef.current?.get(key)
    const storeData = storeProductos.find(
      (p: any) =>
        p?.paquete_id === paqueteId &&
        p?.producto_id === updates[i].producto_id
    ) as any

    const precio = Number(
      storeData?.[`paq_precio_${nuevoTipo}`] ??
      discountData?.[`paq_precio_${nuevoTipo}`] ??
      (updates[i] as any)[`paq_precio_${nuevoTipo}`] ??
      0
    )
    const descuento = Number(
      storeData?.[`paq_descuento_${nuevoTipo}`] ??
      discountData?.[`paq_descuento_${nuevoTipo}`] ??
      (updates[i] as any)[`paq_descuento_${nuevoTipo}`] ??
      0
    )
    const cantidadBase = Number(updates[i].cantidad_base || 0)
    const cantidad = cantidadBase * cantidadPaquete

    updates[i] = {
      ...updates[i],
      tipo_precio: nuevoTipo,
      precio_venta: precio,
      descuento: descuento,
      cantidad,
      subtotal: (precio - descuento) * cantidad,
    }
    precioPaqueteUnitario += (precio - descuento) * cantidadBase
  }

  updates[cabIdx] = {
    ...updates[cabIdx],
    tipo_precio: nuevoTipo,
    precio_venta: precioPaqueteUnitario,
    subtotal: precioPaqueteUnitario * cantidadPaquete,
  }

  useStoreProductoAgregadoVenta.getState().setCarrito(updates)
}

export function useColumnsVender({
  form,
  cantidad_pendiente = false,
  venta,
}: {
  form: FormInstance
  cantidad_pendiente?: boolean
  venta?: VentaConUnidadDerivadaNormal
}) {
  const tipo_moneda = Form.useWatch('tipo_moneda', form)
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const recalcDebounceRef = useRef<ReturnType<typeof setTimeout>>(null)
  const productosVentaStore = useStoreProductoAgregadoVenta((store) => store.productos)

  // Mantener un Map con los precios y descuentos de paquetes
  // Clave: `${paquete_id}_${producto_id}`, Valor: { paq_precio_*, paq_descuento_* }
  const paqueteDiscountsRef = useRef<Map<string, any>>(new Map())

  const monedaPrefix = tipo_moneda === TipoMoneda.SOLES ? 'S/.' : '$.'

  // Guardar los precios y descuentos en el Map cada vez que cambian los
  // productos del store (el store conserva el productoData completo con
  // paq_precio_* / paq_descuento_*, a diferencia de las filas del carrito
  // una vez que el usuario cambia de tipo de precio).
  useEffect(() => {
    for (const producto of productosVentaStore as any[]) {
      if (producto?._tipo_fila === 'paquete_producto' && producto?.paquete_id) {
        const key = `${producto.paquete_id}_${producto.producto_id}`
        paqueteDiscountsRef.current.set(key, {
          paq_precio_publico: producto.paq_precio_publico,
          paq_precio_especial: producto.paq_precio_especial,
          paq_precio_minimo: producto.paq_precio_minimo,
          paq_precio_ultimo: producto.paq_precio_ultimo,
          paq_descuento_publico: producto.paq_descuento_publico,
          paq_descuento_especial: producto.paq_descuento_especial,
          paq_descuento_minimo: producto.paq_descuento_minimo,
          paq_descuento_ultimo: producto.paq_descuento_ultimo,
        })
      }
    }
  }, [productosVentaStore])

  // `columns` se pasa a AG Grid como `columnDefs`. Sin useMemo, este array se
  // recreaba en CADA render del hook (incluyendo cada vez que se agrega o
  // elimina un producto, ya que eso re-renderiza TableVender). AG Grid trata
  // una referencia nueva de columnDefs como "cambiaron las columnas" y
  // redibuja TODAS las filas × TODAS las columnas desde cero (no un simple
  // update de datos), en vez de solo insertar/quitar la fila afectada.
  //
  // Los cellRenderers de abajo leen `params.data` (la fila que AG Grid les
  // pasa fresca en cada invocación) en vez de cerrar sobre una variable del
  // scope de render — por eso columns puede quedar memoizado sin depender
  // del carrito, y agregar/editar una fila solo re-renderiza ESA fila.
  const columns: ColDef<ValuesCardAgregarProductoVenta>[] = useMemo(() => [
    {
      headerName: '#',
      colId: '#',
      width: 50,
      minWidth: 50,
      suppressNavigable: true,
      lockPosition: 'left',
      cellRenderer: (params: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const data = params.data
        const tipoFila = data?._tipo_fila

        // Sub-productos de paquete no muestran número
        if (tipoFila === 'paquete_producto') {
          return <div className='flex items-center h-full justify-center'><span className='text-gray-300'>┗</span></div>
        }

        // Vale promocional
        if (tipoFila === 'vale_promocional') {
          return <div className='flex items-center h-full justify-center'><span className='text-green-600 font-bold'>🎟️</span></div>
        }

        // Contar número de grupo (cabeceras de paquete y productos normales, no vales)
        const carritoActual = useStoreProductoAgregadoVenta.getState().carrito
        const idx = params.node?.rowIndex ?? carritoActual.findIndex((r) => r._row_id === data?._row_id)
        let numeroGrupo = 0
        for (let i = 0; i <= idx; i++) {
          const tipo = carritoActual[i]?._tipo_fila
          if (tipo !== 'paquete_producto' && tipo !== 'vale_promocional') {
            numeroGrupo++
          }
        }

        return (
          <div className='flex items-center h-full justify-center'>
            <span className='font-semibold text-gray-700'>{numeroGrupo}</span>
          </div>
        )
      },
      type: 'numberColumn',
    },
    {
      headerName: 'Imagen',
      colId: 'imagen',
      width: 56,
      minWidth: 56,
      suppressNavigable: true,
      sortable: false,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila
        const tipo = data?._tipo

        // Paquete cabecera y vale promocional: sin imagen
        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return <div className="flex items-center h-full justify-center text-slate-300 text-xs">—</div>
        }

        // Servicio: sin imagen
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
      headerName: 'Código',
      colId: 'codigo',
      minWidth: 70,
      width: 70,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              {tipoFila === 'vale_promocional' && (
                <span className='text-green-600 text-xs font-medium'>{data?.producto_codigo}</span>
              )}
            </div>
          )
        }

        const codigo = data?.producto_codigo

        return (
          <div className='flex items-center h-full'>
            <Tooltip classNames={{ body: 'text-center!' }} title={codigo}>
              <div className={`overflow-hidden text-ellipsis whitespace-nowrap ${tipoFila === 'paquete_producto' ? 'text-gray-600 text-xs' : ''}`}>
                {codigo}
              </div>
            </Tooltip>
          </div>
        )
      },
    },
    {
      headerName: 'Producto',
      colId: 'producto',
      minWidth: 250,
      width: 250,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila
        const paqueteNombre = data?.paquete_nombre
        const productoName = data?.producto_name
        const tipo = data?._tipo
        const servicioNombre = data?.servicio_nombre
        const servicioReferencia = data?.servicio_referencia

        // Paquete cabecera - fondo amarillo/ámbar
        if (tipoFila === 'paquete_cabecera') {
          return (
            <div className='flex flex-col h-full justify-center gap-0.5'>
              <div className='flex items-center gap-2'>
                <span className='text-amber-700 font-bold text-sm'>📦 {paqueteNombre}</span>
              </div>
            </div>
          )
        }

        // Sub-producto de paquete - estilo atenuado
        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex flex-col h-full justify-center gap-0.5'>
              <div className='text-gray-500 text-[13px] overflow-hidden text-ellipsis whitespace-nowrap pl-2'>
                ↳ {productoName}
              </div>
            </div>
          )
        }

        // Vale promocional - texto verde
        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex flex-col h-full justify-center gap-0.5'>
              <div className='text-green-700 font-semibold text-sm'>
                🎟️ {productoName}
              </div>
              <div className='text-green-500 text-[10px]'>
                Se aplicará automáticamente al crear la venta
              </div>
            </div>
          )
        }

        // Producto normal o servicio
        const paquetesCount = data?.paquetes_count as number | undefined

        return (
          <div className='flex flex-col h-full justify-center gap-1'>
            {tipo === 'servicio' && (
              <div className='px-2 py-0.5 bg-violet-100 text-violet-800 rounded text-xs font-bold w-fit'>
                SERVICIO
              </div>
            )}
            <Tooltip classNames={{ body: 'text-center!' }} title={tipo === 'servicio' ? servicioNombre : productoName}>
              <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                {tipo === 'servicio' ? servicioNombre : productoName}
              </div>
            </Tooltip>
            {tipo === 'servicio' && servicioReferencia && (
              <div className='text-xs text-gray-400 italic overflow-hidden text-ellipsis whitespace-nowrap'>
                {servicioReferencia}
              </div>
            )}
            {!!paquetesCount && paquetesCount > 0 && data?.producto_id != null && (
              <PaquetesBadgeVenta
                productoId={data.producto_id}
                count={paquetesCount}
              />
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Marca',
      colId: 'marca',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{data?.marca_name || '-'}</span>
            </div>
          )
        }

        const tipo = data?._tipo
        return (
          <div className='flex items-center h-full'>
            {tipo === 'servicio' ? (
              <span className='text-gray-400'>-</span>
            ) : (
              <Tooltip
                classNames={{ body: 'text-center!' }}
                title={data?.marca_name}
              >
                <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                  {data?.marca_name}
                </div>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'Unidad Derivada',
      colId: 'unidad_derivada',
      minWidth: 150,
      width: 150,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{data?.unidad_derivada_name}</span>
            </div>
          )
        }

        const tipo = data?._tipo

        return (
          <div className='flex items-center h-full'>
            {tipo === 'servicio' ? (
              <span className='text-violet-600 text-xs font-medium'>SERVICIO</span>
            ) : data ? (
              <SelectUnidadDerivadaVenta row={data} />
            ) : null}
          </div>
        );
      },
    },
    {
      headerName: 'Cantidad',
      colId: 'cantidad',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        // Vale promocional - sin cantidad
        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full justify-center'>
              <span className='text-green-600 text-xs font-medium'>Auto</span>
            </div>
          )
        }

        // Cabecera de paquete - cantidad editable (cantidad de paquetes)
        if (tipoFila === 'paquete_cabecera') {
          return (
            <div className='flex flex-col justify-center w-full py-2'>
              <InputNumberBase
                size='small'
                value={data?.cantidad_paquete ?? data?.cantidad}
                precision={0}
                min={1}
                onChange={(newVal) => {
                  if (newVal && data?._row_id) {
                    if (recalcDebounceRef.current) clearTimeout(recalcDebounceRef.current)
                    const rowId = data._row_id
                    recalcDebounceRef.current = setTimeout(() => {
                      recalcularSubProductosPaquete(rowId, Number(newVal))
                    }, 150)
                  }
                }}
              />
            </div>
          )
        }

        // Sub-producto de paquete - cantidad solo lectura + alerta de stock
        if (tipoFila === 'paquete_producto') {
          const cantidad = data?.cantidad
          const unidad_derivada_factor = data?.unidad_derivada_factor
          const stock_fraccion = data?.stock_fraccion
          const cantidadEnFraccion = Number(cantidad || 0) * Number(unidad_derivada_factor || 1)
          const stockDisponible = Number(stock_fraccion || 0)
          const stockInsuficiente = cantidadEnFraccion > stockDisponible
          return (
            <div className='flex flex-col justify-center w-full py-1'>
              <span className='text-gray-600 text-xs text-center'>{Number(cantidad || 0).toFixed(2)}</span>
              {stockInsuficiente && cantidad && (
                <div className='text-red-600 text-[11px] font-medium leading-tight text-center'>
                  ⚠️ Stock: {(stockDisponible / Number(unidad_derivada_factor || 1)).toFixed(2)}
                </div>
              )}
            </div>
          )
        }

        // Producto normal
        const cantidad = data?.cantidad
        const unidad_derivada_factor = data?.unidad_derivada_factor
        const stock_fraccion = data?.stock_fraccion
        const tipo = data?._tipo
        const unidad_derivada_id = data?.unidad_derivada_id
        const otrosAlmacenes = data?.producto_en_almacenes as any[] | undefined

        const cantidadEnFraccion = Number(cantidad || 0) * Number(unidad_derivada_factor || 1)
        const stockDisponible = Number(stock_fraccion || 0)
        const stockEnUnidad = stockDisponible / Number(unidad_derivada_factor || 1)
        const stockInsuficiente = tipo !== 'servicio' && cantidadEnFraccion > stockDisponible

        const almacenesContent = otrosAlmacenes && otrosAlmacenes.length > 0 ? (
          <div className='flex flex-col gap-3 py-1 max-h-72 overflow-y-auto'>
            {otrosAlmacenes.filter((pa: any) => pa.almacen_id !== almacen_id).map((pa: any, i: number) => {
              const ud = pa.unidades_derivadas?.find((u: any) => u.unidad_derivada_id === unidad_derivada_id)
                ?? pa.unidades_derivadas?.[0]
              return (
                <div key={i} className='min-w-[170px]'>
                  <div className='font-semibold text-sm flex items-center gap-1 border-b pb-1 mb-1'>
                    <PiWarehouseFill size={13} className='text-cyan-600' />
                    {pa.almacen?.name || '—'}
                  </div>
                  <div className='flex justify-between text-xs gap-3'>
                    <span className='text-slate-500'>Stock:</span>
                    <span className='font-bold'>
                      <GetStock stock_fraccion={Number(pa.stock_fraccion ?? 0)} unidades_contenidas={Number(unidad_derivada_factor || 1)} />
                    </span>
                  </div>
                  <div className='flex justify-between text-xs gap-3'>
                    <span className='text-slate-500'>Precio Público:</span>
                    <span className='font-bold text-emerald-700'>
                      S/. {Number(ud?.precio_publico ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null

        return (
          <div className='flex flex-col justify-center w-full py-2'>
            <InputNumberBase
              size='small'
              value={cantidad}
              // 3 decimales = precisión real de la DB
              // (unidadderivadainmutableventa.cantidad decimal(9,3)). Con 2 se
              // recortaba en silencio: 14.0375 quedaba 14.04 al editar acá.
              precision={3}
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
            {almacenesContent && (
              <Popover content={almacenesContent} trigger='click' placement='right' title='Stock en sucursales'>
                <div className='flex items-center gap-1 text-[10px] text-cyan-600 cursor-pointer mt-1 hover:text-cyan-800 w-fit'>
                  <PiWarehouseFill size={11} />
                  <span>Ver sucursales</span>
                </div>
              </Popover>
            )}
          </div>
        )
      },
    },
    {
      headerName: 'T. Precio',
      colId: 'tipo_precio',
      minWidth: 130,
      width: 130,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila
        const tipo = data?._tipo

        if (tipoFila === 'paquete_cabecera') {
          const paqueteId = data?.paquete_id
          const tipoPrecioActual = data?.tipo_precio || 'publico'
          return (
            <div className='flex items-center h-full'>
              <SelectBase
                size='small'
                variant='borderless'
                className='w-full'
                value={tipoPrecioActual}
                options={TIPO_PRECIO_PAQUETE_OPTIONS}
                onChange={(nuevoTipo) => {
                  if (data?._row_id && paqueteId != null) {
                    cambiarTipoPrecioPaquete(data._row_id, paqueteId, nuevoTipo as string, paqueteDiscountsRef)
                  }
                }}
                prefix={<MdPriceChange size={14} className='text-amber-600' />}
              />
            </div>
          )
        }

        if (tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional' || tipo === 'servicio') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
            </div>
          )
        }

        return (
          <div className='flex items-center h-full'>
            {data && <SelectTipoPrecioVenta row={data} />}
          </div>
        )
      },
    },
    {
      headerName: 'Precio',
      colId: 'precio',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          const precioBruto = data?._row_id ? getPaquetePrecioBruto(data._row_id) : 0
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm font-medium text-amber-700'>{monedaPrefix} {precioBruto.toFixed(2)}</span>
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          const precio = Number(data?.precio_venta || 0)
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{monedaPrefix} {precio.toFixed(2)}</span>
            </div>
          )
        }

        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
              size='small'
              value={data?.precio_venta}
              precision={4}
              min={0}
              readOnly
              variant='borderless'
            />
          </div>
        )
      },
    },
    {
      headerName: 'Recargo',
      colId: 'recargo',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
            </div>
          )
        }

        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
              size='small'
              value={data?.recargo}
              precision={4}
              min={0}
              onChange={(nuevoRecargo) => {
                if (data?._row_id) patchCarritoRow(data._row_id, { recargo: Number(nuevoRecargo ?? 0) })
              }}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Descuento',
      colId: 'descuento',
      minWidth: 160,
      width: 160,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          const descuentoTotal = data?._row_id ? getPaqueteDescuentoTotal(data._row_id) : 0
          return (
            <div className='flex items-center h-full'>
              {descuentoTotal > 0 ? (
                <span className='text-sm font-medium text-orange-600'>- {monedaPrefix} {descuentoTotal.toFixed(2)}</span>
              ) : (
                <span className='text-gray-300'>-</span>
              )}
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          const descuento = Number(data?.descuento || 0)
          return (
            <div className='flex items-center h-full'>
              {descuento > 0 ? (
                <span className='text-xs text-orange-600 font-medium'>- S/. {descuento.toFixed(2)}</span>
              ) : (
                <span className='text-gray-300'>-</span>
              )}
            </div>
          )
        }

        const descuento_tipo = data?.descuento_tipo ?? DescuentoTipo.MONTO
        const isPorcentaje = descuento_tipo === DescuentoTipo.PORCENTAJE

        return (
          <div className='flex items-center h-full gap-1'>
            <SelectDescuentoTipo
              tipoMoneda={tipo_moneda}
              size='small'
              value={descuento_tipo}
              onChange={(nuevoTipo) => {
                if (data?._row_id) patchCarritoRow(data._row_id, { descuento_tipo: nuevoTipo as DescuentoTipo })
              }}
            />
            <InputNumberBase
              prefix={isPorcentaje ? undefined : (tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. ')}
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
      headerName: 'SubTotal',
      colId: 'subtotal',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-green-600 text-xs font-medium'>Automático</span>
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          const subtotalPaquete = data?._row_id ? getPaqueteSubtotales(data._row_id) : 0
          return (
            <div className='flex items-center h-full'>
              <span className='text-sm font-bold text-amber-700'>{monedaPrefix} {subtotalPaquete.toFixed(2)}</span>
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          const subtotal = Number(data?.subtotal || 0)
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{monedaPrefix} {subtotal.toFixed(2)}</span>
            </div>
          )
        }

        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              size='small'
              value={data?.subtotal}
              prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
              precision={2}
              readOnly
              variant='borderless'
            />
          </div>
        )
      },
    },
    {
      headerName: 'Acciones',
      colId: 'acciones',
      width: 40,
      minWidth: 40,
      cellRenderer: ({ data }: ICellRendererParams<ValuesCardAgregarProductoVenta>) => {
        const tipoFila = data?._tipo_fila
        const paqueteId = data?.paquete_id

        // Sub-productos de paquete no tienen botón de eliminar
        if (tipoFila === 'paquete_producto') {
          return <div className='flex items-center h-full' />
        }

        // Vale promocional - botón de eliminar que excluye el vale
        if (tipoFila === 'vale_promocional') {
          const handleExcluirVale = () => {
            const valeId = Math.abs(Number(data?.producto_id))
            if (valeId) {
              useStoreProductoAgregadoVenta.getState().excluirVale(valeId)
            }
            if (data?._row_id) removeCarritoRow(data._row_id)
          }
          return (
            <div className='flex items-center h-full'>
              <Tooltip title='Excluir vale promocional'>
                <MdDelete
                  onClick={handleExcluirVale}
                  size={15}
                  className='cursor-pointer text-green-600 hover:text-rose-700 hover:scale-105 transition-all active:scale-95'
                />
              </Tooltip>
            </div>
          )
        }

        const handleEliminar = () => {
          if (tipoFila === 'paquete_cabecera' && paqueteId) {
            // Eliminar cabecera + todos los sub-productos del mismo paquete
            removeCarritoPaquete(paqueteId)
          } else if (data?._row_id) {
            removeCarritoRow(data._row_id)
          }
        }

        return (
          <div className='flex items-center gap-2 h-full'>
            <Tooltip title={tipoFila === 'paquete_cabecera' ? 'Eliminar paquete completo' : 'Eliminar'}>
              <MdDelete
                onClick={handleEliminar}
                size={15}
                className='cursor-pointer text-rose-700 hover:scale-105 transition-all active:scale-95'
              />
            </Tooltip>
          </div>
        )
      },
    },
  // Los helpers de paquete (cambiarTipoPrecioPaquete, getPaquete*, etc.) leen
  // el store SIEMPRE fresco vía .getState() (no cierran sobre productos ni
  // carrito), así que quedan fuera de las deps a propósito — incluirlos
  // anularía la memoización, que es justo lo que evita el rebuild completo
  // de AG Grid en cada producto agregado/editado/eliminado.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [form, cantidad_pendiente, venta, tipo_moneda, monedaPrefix, almacen_id])

  return { columns }
}
