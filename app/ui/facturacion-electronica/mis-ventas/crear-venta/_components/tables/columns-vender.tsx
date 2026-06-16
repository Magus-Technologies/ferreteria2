'use client'

import { DescuentoTipo, TipoMoneda } from '~/lib/api/venta'
import { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Form, FormInstance, FormListFieldData, Image, Tooltip, Popover } from 'antd'
import { useRef, useEffect, useState } from 'react'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import SelectDescuentoTipo from '~/app/_components/form/selects/select-descuento-tipo'
import { MdDelete } from 'react-icons/md'
import SelectUnidadDerivadaVenta from '../form/select-unidad-derivada-venta'
import SelectTipoPrecioVenta from '../form/select-tipo-precio-venta'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
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

export function useColumnsVender({
  form,
  remove,
  cantidad_pendiente = false,
  venta,
}: {
  form: FormInstance
  remove: (index: number | number[]) => void
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
  // paq_precio_* / paq_descuento_*, a diferencia del form de Ant Design).
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

  /** Recalcular sub-productos de la instancia de paquete cuya cabecera está en cabecerIndex. */
  function recalcularSubProductosPaquete(cabecerIndex: number, nuevaCantidadPaquete: number) {
    const allProductos = form.getFieldValue('productos') || []
    const updates = [...allProductos]
    let precioPaqueteUnitario = 0

    // Calcular precio unitario iterando los sub-productos consecutivos
    for (let i = cabecerIndex + 1; i < updates.length; i++) {
      if (updates[i]?._tipo_fila !== 'paquete_producto') break
      const cantidadBase = Number(updates[i].cantidad_base || 0)
      const precio = Number(updates[i].precio_venta || 0)
      const descuento = Number(updates[i].descuento || 0)
      precioPaqueteUnitario += (precio - descuento) * cantidadBase
    }

    // Actualizar sub-productos consecutivos
    for (let i = cabecerIndex + 1; i < updates.length; i++) {
      if (updates[i]?._tipo_fila !== 'paquete_producto') break
      const cantidadBase = Number(updates[i].cantidad_base || 0)
      const nuevaCantidad = cantidadBase * nuevaCantidadPaquete
      updates[i] = {
        ...updates[i],
        cantidad: nuevaCantidad,
        // Para sub-productos de paquete, descuento es POR UNIDAD (no total).
        // Usar (precio - descuento) × cantidad en lugar de calcularSubtotalVenta
        // que trata el descuento como total fijo.
        subtotal: (Number(updates[i].precio_venta || 0) - Number(updates[i].descuento || 0)) * nuevaCantidad,
      }
    }

    // Actualizar cabecera
    updates[cabecerIndex] = {
      ...updates[cabecerIndex],
      cantidad_paquete: nuevaCantidadPaquete,
      cantidad: nuevaCantidadPaquete,
      precio_venta: precioPaqueteUnitario,
      subtotal: precioPaqueteUnitario * nuevaCantidadPaquete,
    }

    form.setFieldValue('productos', updates)
  }

  /** Obtener subtotales de los sub-productos de la instancia de paquete en cabecerIndex. */
  function getPaqueteSubtotales(cabecerIndex: number) {
    const allProductos = form.getFieldValue('productos') || []
    let total = 0
    for (let i = cabecerIndex + 1; i < allProductos.length; i++) {
      if (allProductos[i]?._tipo_fila !== 'paquete_producto') break
      total += Number(allProductos[i].subtotal || 0)
    }
    return total
  }

  /**
   * Itera desde cabecerIndex+1 mientras las filas sean paquete_producto.
   * Esto distingue correctamente múltiples instancias del mismo paquete sin
   * necesitar un ID de instancia adicional.
   */
  function getPaqueteDescuentoTotal(cabecerIndex: number) {
    const allProductos = form.getFieldValue('productos') || []
    let total = 0
    for (let i = cabecerIndex + 1; i < allProductos.length; i++) {
      if (allProductos[i]?._tipo_fila !== 'paquete_producto') break
      total += Number(allProductos[i].descuento || 0) * Number(allProductos[i].cantidad || 0)
    }
    return total
  }

  /** Precio bruto (precio_venta × cantidad) de los sub-productos de esta instancia. */
  function getPaquetePrecioBruto(cabecerIndex: number) {
    const allProductos = form.getFieldValue('productos') || []
    let total = 0
    for (let i = cabecerIndex + 1; i < allProductos.length; i++) {
      if (allProductos[i]?._tipo_fila !== 'paquete_producto') break
      total += Number(allProductos[i].precio_venta || 0) * Number(allProductos[i].cantidad || 0)
    }
    return total
  }

  /** Cambiar tipo de precio para la instancia de paquete cuya cabecera está en cabecerIndex. */
  function cambiarTipoPrecioPaquete(cabecerIndex: number, paqueteId: number, nuevoTipo: string) {
    const allProductos = form.getFieldValue('productos') || []
    const updates = [...allProductos]
    // Leer el store SIEMPRE fresco (evita closures obsoletas en los
    // cellRenderers cacheados de AG Grid)
    const storeProductos = useStoreProductoAgregadoVenta.getState().productos as any[]
    let precioPaqueteUnitario = 0

    const cantidadPaquete = Number(updates[cabecerIndex]?.cantidad_paquete || 1)

    for (let i = cabecerIndex + 1; i < updates.length; i++) {
      if (updates[i]?._tipo_fila !== 'paquete_producto') break

      const key = `${paqueteId}_${updates[i].producto_id}`
      const discountData = paqueteDiscountsRef.current.get(key)
      // Fuente confiable: el store zustand guarda el productoData completo
      // con paq_precio_* / paq_descuento_* sin pasar por el registro de Ant Form
      const storeData = storeProductos.find(
        (p: any) =>
          p?.paquete_id === paqueteId &&
          p?.producto_id === updates[i].producto_id
      ) as any

      // Leer los valores: store -> Map -> objeto del producto
      const precio = Number(
        storeData?.[`paq_precio_${nuevoTipo}`] ??
        discountData?.[`paq_precio_${nuevoTipo}`] ??
        updates[i][`paq_precio_${nuevoTipo}`] ??
        0
      )
      const descuento = Number(
        storeData?.[`paq_descuento_${nuevoTipo}`] ??
        discountData?.[`paq_descuento_${nuevoTipo}`] ??
        updates[i][`paq_descuento_${nuevoTipo}`] ??
        0
      )
      const cantidadBase = Number(updates[i].cantidad_base || 0)
      const cantidad = cantidadBase * cantidadPaquete

      // IMPORTANTE: Preservar TODOS los campos paq_precio_* y paq_descuento_* para que no se pierdan
      updates[i] = {
        ...updates[i],
        tipo_precio: nuevoTipo,
        precio_venta: precio,
        descuento: descuento,
        cantidad,
        subtotal: (precio - descuento) * cantidad,
        paq_precio_publico: updates[i].paq_precio_publico,
        paq_precio_especial: updates[i].paq_precio_especial,
        paq_precio_minimo: updates[i].paq_precio_minimo,
        paq_precio_ultimo: updates[i].paq_precio_ultimo,
        paq_descuento_publico: updates[i].paq_descuento_publico,
        paq_descuento_especial: updates[i].paq_descuento_especial,
        paq_descuento_minimo: updates[i].paq_descuento_minimo,
        paq_descuento_ultimo: updates[i].paq_descuento_ultimo,
      }
      precioPaqueteUnitario += (precio - descuento) * cantidadBase
    }

    updates[cabecerIndex] = {
      ...updates[cabecerIndex],
      tipo_precio: nuevoTipo,
      precio_venta: precioPaqueteUnitario,
      subtotal: precioPaqueteUnitario * cantidadPaquete,
    }

    form.setFieldValue('productos', updates)
    form.setFieldValue('_refresh_paquete', Date.now())
  }

  const columns: ColDef<FormListFieldData>[] = [
    {
      headerName: '#',
      field: 'name',
      colId: '#',
      width: 50,
      minWidth: 50,
      suppressNavigable: true,
      lockPosition: 'left',
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        // Sub-productos de paquete no muestran número
        if (tipoFila === 'paquete_producto') {
          return <div className='flex items-center h-full justify-center'><span className='text-gray-300'>┗</span></div>
        }

        // Vale promocional
        if (tipoFila === 'vale_promocional') {
          return <div className='flex items-center h-full justify-center'><span className='text-green-600 font-bold'>🎟️</span></div>
        }

        // Contar número de grupo (cabeceras de paquete y productos normales, no vales)
        let numeroGrupo = 0
        for (let i = 0; i <= value; i++) {
          const tipo = form.getFieldValue(['productos', i, '_tipo_fila'])
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
      field: 'name',
      colId: 'imagen',
      width: 56,
      minWidth: 56,
      suppressNavigable: true,
      sortable: false,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])

        // Paquete cabecera y vale promocional: sin imagen
        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return <div className="flex items-center h-full justify-center text-slate-300 text-xs">—</div>
        }

        // Servicio: sin imagen
        if (tipo === 'servicio') {
          return <div className="flex items-center h-full justify-center text-slate-300 text-xs">—</div>
        }

        const imgPath = form.getFieldValue(['productos', value, 'img']) as string | null | undefined
        const src = getStorageUrl(imgPath)
        const isPaqueteProducto = tipoFila === 'paquete_producto'

        return (
          <div className="flex items-center h-full justify-center">
            {src ? (
              <Image
                src={src}
                alt={form.getFieldValue(['productos', value, 'producto_name']) || 'Producto'}
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
      field: 'name',
      colId: 'codigo',
      minWidth: 70,
      width: 70,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              {tipoFila === 'vale_promocional' && (
                <span className='text-green-600 text-xs font-medium'>{form.getFieldValue(['productos', value, 'producto_codigo'])}</span>
              )}
              <InputBase propsForm={{ name: [value, 'producto_codigo'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        const codigo = form.getFieldValue(['productos', value, 'producto_codigo'])

        return (
          <div className='flex items-center h-full'>
            <Tooltip classNames={{ body: 'text-center!' }} title={codigo}>
              <div className={`overflow-hidden text-ellipsis whitespace-nowrap ${tipoFila === 'paquete_producto' ? 'text-gray-600 text-xs' : ''}`}>
                {codigo}
              </div>
            </Tooltip>
            <InputBase
              propsForm={{
                name: [value, 'producto_codigo'],
                rules: tipoFila ? undefined : [{ required: true, message: '' }],
                hidden: true,
              }}
              readOnly
              variant='borderless'
              formWithMessage={false}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Producto',
      field: 'name',
      colId: 'producto',
      minWidth: 250,
      width: 250,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteNombre = form.getFieldValue(['productos', value, 'paquete_nombre'])
        const productoName = form.getFieldValue(['productos', value, 'producto_name'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])
        const servicioNombre = form.getFieldValue(['productos', value, 'servicio_nombre'])
        const servicioReferencia = form.getFieldValue(['productos', value, 'servicio_referencia'])

        // Hidden fields comunes
        const hiddenFields = (
          <>
            <InputNumberBase propsForm={{ name: [value, 'producto_id'], rules: tipoFila === 'paquete_cabecera' ? undefined : [{ required: true, message: '' }], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'stock_fraccion'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paquete_id'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'paquete_nombre'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, '_tipo'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, '_tipo_fila'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'servicio_id'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'servicio_nombre'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'servicio_codigo_sunat'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'servicio_referencia'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'cantidad_paquete'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'cantidad_base'], hidden: true }} formWithMessage={false} />
            <InputBase propsForm={{ name: [value, 'producto_name'], rules: tipoFila === 'paquete_cabecera' ? undefined : [{ required: true, message: '' }], hidden: true }} readOnly variant='borderless' formWithMessage={false} />
            {/* Precios y descuentos por tipo del paquete (registrados para que Ant Form los preserve al cambiar tipo de precio) */}
            <InputNumberBase propsForm={{ name: [value, 'paq_precio_publico'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paq_precio_especial'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paq_precio_minimo'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paq_precio_ultimo'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paq_descuento_publico'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paq_descuento_especial'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paq_descuento_minimo'], hidden: true }} formWithMessage={false} />
            <InputNumberBase propsForm={{ name: [value, 'paq_descuento_ultimo'], hidden: true }} formWithMessage={false} />
          </>
        )

        // Paquete cabecera - fondo amarillo/ámbar
        if (tipoFila === 'paquete_cabecera') {
          return (
            <div className='flex flex-col h-full justify-center gap-0.5'>
              {hiddenFields}
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
              {hiddenFields}
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
              {hiddenFields}
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
        const paquetesCount = form.getFieldValue(['productos', value, 'paquetes_count']) as number | undefined

        return (
          <div className='flex flex-col h-full justify-center gap-1'>
            {hiddenFields}
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
            {!!paquetesCount && paquetesCount > 0 && (
              <PaquetesBadgeVenta
                productoId={form.getFieldValue(['productos', value, 'producto_id'])}
                count={paquetesCount}
              />
            )}
          </div>
        )
      },
      wrapText: true,
      autoHeight: true,
    },
    {
      headerName: 'Marca',
      field: 'name',
      colId: 'marca',
      minWidth: 120,
      width: 120,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputBase propsForm={{ name: [value, 'marca_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{form.getFieldValue(['productos', value, 'marca_name']) || '-'}</span>
              <InputBase propsForm={{ name: [value, 'marca_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        const tipo = form.getFieldValue(['productos', value, '_tipo'])
        return (
          <div className='flex items-center h-full'>
            {tipo === 'servicio' ? (
              <span className='text-gray-400'>-</span>
            ) : (
              <Tooltip
                classNames={{ body: 'text-center!' }}
                title={form.getFieldValue(['productos', value, 'marca_name'])}
              >
                <div className='overflow-hidden text-ellipsis whitespace-nowrap'>
                  {form.getFieldValue(['productos', value, 'marca_name'])}
                </div>
              </Tooltip>
            )}
            <InputBase
              propsForm={{
                name: [value, 'marca_name'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
                hidden: true,
              }}
              readOnly
              variant='borderless'
              formWithMessage={false}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Unidad Derivada',
      field: 'name',
      colId: 'unidad_derivada',
      minWidth: 150,
      width: 150,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_id'], hidden: true }} formWithMessage={false} />
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_factor'], hidden: true }} formWithMessage={false} />
              <InputBase propsForm={{ name: [value, 'unidad_derivada_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-600 text-xs'>{form.getFieldValue(['productos', value, 'unidad_derivada_name'])}</span>
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_id'], hidden: true }} formWithMessage={false} />
              <InputNumberBase propsForm={{ name: [value, 'unidad_derivada_factor'], hidden: true }} formWithMessage={false} />
              <InputBase propsForm={{ name: [value, 'unidad_derivada_name'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        const productoId = form.getFieldValue(['productos', value, 'producto_id']);
        const tipo = form.getFieldValue(['productos', value, '_tipo']);

        return (
          <div className='flex items-center h-full'>
            {tipo === 'servicio' ? (
              <span className='text-violet-600 text-xs font-medium'>SERVICIO</span>
            ) : (
              <SelectUnidadDerivadaVenta
                form={form}
                fieldIndex={value}
                productoId={productoId}
              />
            )}
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_id'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputNumberBase
              propsForm={{
                name: [value, 'unidad_derivada_factor'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
                hidden: true,
              }}
              formWithMessage={false}
            />
            <InputBase
              propsForm={{
                name: [value, 'unidad_derivada_name'],
                rules: tipo === 'servicio' ? undefined : [{ required: true, message: '' }],
                hidden: true,
              }}
              readOnly
              variant='borderless'
              formWithMessage={false}
            />
          </div>
        );
      },
    },
    {
      headerName: 'Cantidad',
      field: 'name',
      colId: 'cantidad',
      minWidth: 120,
      width: 120,
      wrapText: true,
      autoHeight: true,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        // Vale promocional - sin cantidad
        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full justify-center'>
              <span className='text-green-600 text-xs font-medium'>Auto</span>
              <InputNumberBase propsForm={{ name: [value, 'cantidad'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        // Cabecera de paquete - cantidad editable (cantidad de paquetes)
        if (tipoFila === 'paquete_cabecera') {
          return (
            <div className='flex flex-col justify-center w-full py-2'>
              <InputNumberBase
                size='small'
                propsForm={{
                  name: [value, 'cantidad'],
                  rules: [{ required: true, message: '' }],
                }}
                precision={0}
                min={1}
                formWithMessage={false}
                onChange={(newVal) => {
                  if (newVal) {
                    if (recalcDebounceRef.current) clearTimeout(recalcDebounceRef.current)
                    recalcDebounceRef.current = setTimeout(() => {
                      recalcularSubProductosPaquete(value, Number(newVal))
                    }, 150)
                  }
                }}
              />
            </div>
          )
        }

        // Sub-producto de paquete - cantidad solo lectura + alerta de stock
        if (tipoFila === 'paquete_producto') {
          const cantidad = form.getFieldValue(['productos', value, 'cantidad'])
          const unidad_derivada_factor = form.getFieldValue(['productos', value, 'unidad_derivada_factor'])
          const stock_fraccion = form.getFieldValue(['productos', value, 'stock_fraccion'])
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
              <InputNumberBase propsForm={{ name: [value, 'cantidad'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        // Producto normal
        const cantidad = form.getFieldValue(['productos', value, 'cantidad'])
        const unidad_derivada_factor = form.getFieldValue(['productos', value, 'unidad_derivada_factor'])
        const stock_fraccion = form.getFieldValue(['productos', value, 'stock_fraccion'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])
        const unidad_derivada_id = form.getFieldValue(['productos', value, 'unidad_derivada_id'])
        const otrosAlmacenes = form.getFieldValue(['productos', value, 'producto_en_almacenes']) as any[] | undefined

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
              propsForm={{
                name: [value, 'cantidad'],
                rules: [{ required: true, message: '' }],
              }}
              precision={2}
              min={0}
              formWithMessage={false}
              onChange={() => {
                calcularSubtotalForm({ form, value })
                autoSeleccionarMejorPrecio({ form, fieldIndex: value, productosVentaStore })
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
      field: 'name',
      colId: 'tipo_precio',
      minWidth: 130,
      width: 130,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const tipo = form.getFieldValue(['productos', value, '_tipo'])

        if (tipoFila === 'paquete_cabecera') {
          const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])
          return (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const tipoPrecioActual = form.getFieldValue(['productos', value, 'tipo_precio']) || 'publico'
                return (
                  <div className='flex items-center h-full'>
                    <SelectBase
                      size='small'
                      variant='borderless'
                      className='w-full'
                      value={tipoPrecioActual}
                      options={TIPO_PRECIO_PAQUETE_OPTIONS}
                      onChange={(nuevoTipo) => cambiarTipoPrecioPaquete(value, paqueteId, nuevoTipo as string)}
                      prefix={<MdPriceChange size={14} className='text-amber-600' />}
                    />
                    <InputBase propsForm={{ name: [value, 'tipo_precio'], hidden: true }} formWithMessage={false} />
                  </div>
                )
              }}
            </Form.Item>
          )
        }

        if (tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional' || tipo === 'servicio') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputBase propsForm={{ name: [value, 'tipo_precio'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        const productoId = form.getFieldValue(['productos', value, 'producto_id'])

        return (
          <div className='flex items-center h-full'>
            <SelectTipoPrecioVenta
              form={form}
              fieldIndex={value}
              productoId={productoId}
            />
            <InputBase propsForm={{ name: [value, 'tipo_precio'], hidden: true }} formWithMessage={false} />
          </div>
        )
      },
    },
    {
      headerName: 'Precio',
      field: 'name',
      colId: 'precio',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputNumberBase propsForm={{ name: [value, 'precio_venta'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          return (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const precioBruto = getPaquetePrecioBruto(value)
                return (
                  <div className='flex items-center h-full'>
                    <span className='text-sm font-medium text-amber-700'>{monedaPrefix} {precioBruto.toFixed(2)}</span>
                    <InputNumberBase propsForm={{ name: [value, 'precio_venta'], hidden: true }} formWithMessage={false} />
                  </div>
                )
              }}
            </Form.Item>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const precio = Number(form.getFieldValue(['productos', value, 'precio_venta']) || 0)
                return (
                  <div className='flex items-center h-full'>
                    <span className='text-gray-600 text-xs'>{monedaPrefix} {precio.toFixed(2)}</span>
                    <InputNumberBase propsForm={{ name: [value, 'precio_venta'], hidden: true }} formWithMessage={false} />
                  </div>
                )
              }}
            </Form.Item>
          )
        }

        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
              size='small'
              propsForm={{
                name: [value, 'precio_venta'],
                rules: [{ required: true, message: '' }],
              }}
              precision={4}
              min={0}
              formWithMessage={false}
              readOnly
              variant='borderless'
            />
          </div>
        )
      },
    },
    {
      headerName: 'Recargo',
      field: 'name',
      colId: 'recargo',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'paquete_cabecera' || tipoFila === 'paquete_producto' || tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <InputNumberBase propsForm={{ name: [value, 'recargo'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
              size='small'
              propsForm={{
                name: [value, 'recargo'],
              }}
              precision={4}
              min={0}
              formWithMessage={false}
              onChange={() => calcularSubtotalForm({ form, value })}
            />
          </div>
        )
      },
    },
    {
      headerName: 'Descuento',
      field: 'name',
      colId: 'descuento',
      minWidth: 160,
      width: 160,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-gray-300'>-</span>
              <SelectDescuentoTipo
                tipoMoneda={tipo_moneda}
                formWithMessage={false}
                size='small'
                propsForm={{ name: [value, 'descuento_tipo'], hidden: true }}
              />
              <InputNumberBase propsForm={{ name: [value, 'descuento'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          return (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const descuentoTotal = getPaqueteDescuentoTotal(value)
                return (
                  <div className='flex items-center h-full'>
                    <SelectDescuentoTipo
                      tipoMoneda={tipo_moneda}
                      formWithMessage={false}
                      size='small'
                      propsForm={{ name: [value, 'descuento_tipo'], hidden: true }}
                    />
                    <InputNumberBase propsForm={{ name: [value, 'descuento'], hidden: true }} formWithMessage={false} />
                    {descuentoTotal > 0 ? (
                      <span className='text-sm font-medium text-orange-600'>- {monedaPrefix} {descuentoTotal.toFixed(2)}</span>
                    ) : (
                      <span className='text-gray-300'>-</span>
                    )}
                  </div>
                )
              }}
            </Form.Item>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const descuento = Number(form.getFieldValue(['productos', value, 'descuento']) || 0)
                return (
                  <div className='flex items-center h-full'>
                    <SelectDescuentoTipo
                      tipoMoneda={tipo_moneda}
                      formWithMessage={false}
                      size='small'
                      propsForm={{ name: [value, 'descuento_tipo'], hidden: true }}
                    />
                    <InputNumberBase propsForm={{ name: [value, 'descuento'], hidden: true }} formWithMessage={false} />
                    {descuento > 0 ? (
                      <span className='text-xs text-orange-600 font-medium'>- S/. {descuento.toFixed(2)}</span>
                    ) : (
                      <span className='text-gray-300'>-</span>
                    )}
                  </div>
                )
              }}
            </Form.Item>
          )
        }

        return (
          <div className='flex items-center h-full gap-1'>
            <SelectDescuentoTipo
              tipoMoneda={tipo_moneda}
              formWithMessage={false}
              size='small'
              propsForm={{
                name: [value, 'descuento_tipo'],
                hasFeedback: false,
              }}
              onChange={() => {
                calcularSubtotalForm({ form, value })
                form.setFieldValue(['productos', value, '_refresh'], Date.now())
              }}
            />
            <Form.Item noStyle shouldUpdate={(prev, curr) => {
              return prev.productos?.[value]?.descuento_tipo !== curr.productos?.[value]?.descuento_tipo
            }}>
              {() => {
                const descuento_tipo = form.getFieldValue(['productos', value, 'descuento_tipo'])
                const isPorcentaje = descuento_tipo === DescuentoTipo.PORCENTAJE

                return (
                  <InputNumberBase
                    prefix={isPorcentaje ? undefined : (tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. ')}
                    suffix={isPorcentaje ? '%' : undefined}
                    size='small'
                    className='w-full'
                    propsForm={{
                      name: [value, 'descuento'],
                    }}
                    precision={isPorcentaje ? 2 : 4}
                    min={0}
                    max={isPorcentaje ? 100 : undefined}
                    formWithMessage={false}
                    onChange={() => calcularSubtotalForm({ form, value })}
                  />
                )
              }}
            </Form.Item>
          </div>
        )
      },
    },
    {
      headerName: 'SubTotal',
      field: 'name',
      colId: 'subtotal',
      minWidth: 110,
      width: 110,
      cellRenderer: ({ value }: ICellRendererParams<FormListFieldData>) => {
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        if (tipoFila === 'vale_promocional') {
          return (
            <div className='flex items-center h-full'>
              <span className='text-green-600 text-xs font-medium'>Automático</span>
              <InputNumberBase propsForm={{ name: [value, 'subtotal'], hidden: true }} formWithMessage={false} />
            </div>
          )
        }

        if (tipoFila === 'paquete_cabecera') {
          return (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const subtotalPaquete = getPaqueteSubtotales(value)
                return (
                  <div className='flex items-center h-full'>
                    <span className='text-sm font-bold text-amber-700'>{monedaPrefix} {subtotalPaquete.toFixed(2)}</span>
                    <InputNumberBase propsForm={{ name: [value, 'subtotal'], hidden: true }} formWithMessage={false} />
                  </div>
                )
              }}
            </Form.Item>
          )
        }

        if (tipoFila === 'paquete_producto') {
          return (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const subtotal = Number(form.getFieldValue(['productos', value, 'subtotal']) || 0)
                return (
                  <div className='flex items-center h-full'>
                    <span className='text-gray-600 text-xs'>{monedaPrefix} {subtotal.toFixed(2)}</span>
                    <InputNumberBase propsForm={{ name: [value, 'subtotal'], hidden: true }} formWithMessage={false} />
                  </div>
                )
              }}
            </Form.Item>
          )
        }

        return (
          <div className='flex items-center h-full'>
            <InputNumberBase
              size='small'
              propsForm={{
                name: [value, 'subtotal'],
                rules: [{ required: true, message: '' }],
              }}
              prefix={tipo_moneda === TipoMoneda.SOLES ? 'S/. ' : '$. '}
              precision={2}
              formWithMessage={false}
              readOnly
              variant='borderless'
            />
          </div>
        )
      },
    },
    {
      headerName: 'Acciones',
      field: 'name',
      colId: 'acciones',
      width: 40,
      minWidth: 40,
      cellRenderer: ({ data }: ICellRendererParams<FormListFieldData>) => {
        const value = data?.name
        const tipoFila = form.getFieldValue(['productos', value, '_tipo_fila'])
        const paqueteId = form.getFieldValue(['productos', value, 'paquete_id'])

        // Sub-productos de paquete no tienen botón de eliminar
        if (tipoFila === 'paquete_producto') {
          return <div className='flex items-center h-full' />
        }

        // Vale promocional - botón de eliminar que excluye el vale
        if (tipoFila === 'vale_promocional') {
          const handleExcluirVale = () => {
            const productoId = form.getFieldValue(['productos', value, 'producto_id'])
            const valeId = Math.abs(Number(productoId))
            if (valeId) {
              useStoreProductoAgregadoVenta.getState().excluirVale(valeId)
            }
            remove(value!)
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
            const indices: number[] = []
            const allProductos = form.getFieldValue('productos') || []
            allProductos.forEach((_: any, i: number) => {
              if (form.getFieldValue(['productos', i, 'paquete_id']) === paqueteId) {
                indices.push(i)
              }
            })
            remove(indices.reverse())
          } else {
            remove(value!)
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
  ]

  return { columns }
}

function calcularSubtotalForm({
  form,
  value,
}: {
  form: FormInstance
  value: number
}) {
  form.setFieldValue(
    ['productos', value, 'subtotal'],
    calcularSubtotalVenta({
      precio_venta: Number(
        form.getFieldValue(['productos', value, 'precio_venta']) ?? 0
      ),
      recargo: Number(form.getFieldValue(['productos', value, 'recargo']) ?? 0),
      descuento_tipo: form.getFieldValue([
        'productos',
        value,
        'descuento_tipo',
      ]) as DescuentoTipo,
      descuento: Number(
        form.getFieldValue(['productos', value, 'descuento']) ?? 0
      ),
      cantidad: Number(
        form.getFieldValue(['productos', value, 'cantidad']) ?? 0
      ),
    })
  )
}

type TipoPrecio = 'publico' | 'especial' | 'minimo' | 'ultimo'

const activadorMap: Record<TipoPrecio, string | null> = {
  publico: null,
  especial: 'activador_especial',
  minimo: 'activador_minimo',
  ultimo: 'activador_ultimo',
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
function autoSeleccionarMejorPrecio({
  form,
  fieldIndex,
  productosVentaStore,
}: {
  form: FormInstance
  fieldIndex: number
  productosVentaStore: ReturnType<typeof useStoreProductoAgregadoVenta.getState>['productos']
}) {
  const productoId = form.getFieldValue(['productos', fieldIndex, 'producto_id'])
  const unidadDerivadaId = form.getFieldValue(['productos', fieldIndex, 'unidad_derivada_id'])
  const cantidad = Number(form.getFieldValue(['productos', fieldIndex, 'cantidad']) ?? 0)
  const tipoPrecioActual = (form.getFieldValue(['productos', fieldIndex, 'tipo_precio']) || 'publico') as TipoPrecio

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
      aplicarPrecio(form, fieldIndex, mejor, ud, cantidad)
    }
    return
  }

  // Solo auto-actualizar si el mejor tiene un activador mayor que el actual
  // (respeta selección manual a tier inferior mientras la cantidad no cambie hacia arriba)
  const activadorActual = activadores[tipoPrecioActual] ?? 0
  if (mejorAct > activadorActual) {
    aplicarPrecio(form, fieldIndex, mejor, ud, cantidad)
  }
}

function aplicarPrecio(
  form: FormInstance,
  fieldIndex: number,
  tipo: TipoPrecio,
  ud: any,
  cantidad: number,
) {
  const preciosMap: Record<TipoPrecio, { precio: string; comision: string }> = {
    publico: { precio: 'precio_publico', comision: 'comision_publico' },
    especial: { precio: 'precio_especial', comision: 'comision_especial' },
    minimo: { precio: 'precio_minimo', comision: 'comision_minimo' },
    ultimo: { precio: 'precio_ultimo', comision: 'comision_ultimo' },
  }

  const { precio: precioKey, comision: comisionKey } = preciosMap[tipo]
  const precio = Number(ud[precioKey] ?? 0)
  const comision = Number(ud[comisionKey] ?? 0)

  form.setFieldValue(['productos', fieldIndex, 'tipo_precio'], tipo)
  form.setFieldValue(['productos', fieldIndex, 'precio_venta'], precio)
  form.setFieldValue(['productos', fieldIndex, 'comision'], comision)

  // Recalcular subtotal con el nuevo precio
  const recargo = Number(form.getFieldValue(['productos', fieldIndex, 'recargo']) ?? 0)
  const descuento_tipo = form.getFieldValue(['productos', fieldIndex, 'descuento_tipo']) as DescuentoTipo
  const descuento = Number(form.getFieldValue(['productos', fieldIndex, 'descuento']) ?? 0)

  form.setFieldValue(
    ['productos', fieldIndex, 'subtotal'],
    calcularSubtotalVenta({ precio_venta: precio, recargo, descuento_tipo, descuento, cantidad })
  )

  // Forzar re-render de la celda del tipo de precio en AG Grid
  form.setFieldValue(['productos', fieldIndex, '_refresh'], Date.now())
}
