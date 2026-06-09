/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react'
import { FaBoxes, FaPiggyBank, FaPlusCircle } from 'react-icons/fa'
import { FaMoneyBillTrendUp, FaWeightHanging, FaBoxOpen } from 'react-icons/fa6'
import { useQuery } from '@tanstack/react-query'
import { paqueteApi } from '~/lib/api/paquete'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase, {
  RefSelectBaseProps,
} from '~/app/_components/form/selects/select-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import { App, Badge, Button, Input, Modal, Radio } from 'antd'
import type { InputRef } from 'antd'
import type { TipoPrecio } from '~/lib/api/paquete'
import ModalBuscarPaquete from '~/app/_components/modals/modal-buscar-paquete'
import { useStorePaqueteSeleccionado } from '~/app/ui/facturacion-electronica/mis-ventas/store/store-paquete-seleccionado'
import { FormCreateVenta } from '../others/body-vender'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import SelectDescuentoTipo from '~/app/_components/form/selects/select-descuento-tipo'
import { DescuentoTipo, TipoMoneda } from '~/lib/api/venta'
import SelectPrecios from '~/app/_components/form/selects/select-precios'
import { calcularSubtotalVenta } from '../tables/columns-vender'
import { parseCantidadFraccion, formatCantidadFraccion, GetStock } from '~/app/_utils/get-stock'

function InputCantidadFraccion({
  value,
  factor,
  onChange,
  onKeyUp,
  inputRef,
}: {
  value: number | undefined
  factor: number
  onChange: (val: number | null) => void
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>
  inputRef?: React.RefObject<InputRef | null>
}) {
  const [disp, setDisp] = useState(() =>
    value != null ? formatCantidadFraccion(value, factor) : ''
  )

  useEffect(() => {
    setDisp(value != null ? formatCantidadFraccion(value, factor) : '')
  }, [value, factor])

  const commit = (raw: string) => {
    if (!raw.trim()) { onChange(null); return }
    const parsed = parseCantidadFraccion(raw, factor)
    if (parsed !== null && parsed > 0) {
      onChange(parsed)
    } else {
      setDisp(value != null ? formatCantidadFraccion(value, factor) : '')
    }
  }

  return (
    <Input
      ref={inputRef}
      placeholder="Cantidad"
      prefix={<FaBoxes size={15} className="text-rose-700 mx-1" />}
      value={disp}
      onChange={(e) => setDisp(e.target.value)}
      onBlur={() => commit(disp)}
      onKeyUp={(e) => {
        if (e.key === 'Enter') commit(disp)
        onKeyUp?.(e)
      }}
    />
  )
}

export type ValuesCardAgregarProductoVenta = Partial<
  FormCreateVenta['productos'][number]
>

export const valuesDefault: ValuesCardAgregarProductoVenta & { precio_venta_key?: string } = {
  cantidad: undefined,
  unidad_derivada_id: undefined,
  precio_venta: undefined,
  recargo: undefined,
  descuento_tipo: DescuentoTipo.MONTO,
  descuento: undefined,

  producto_id: undefined,
  producto_name: undefined,
  marca_name: undefined,
  unidad_derivada_name: undefined,
  precio_venta_key: undefined,
}

export default function CardAgregarProductoVenta({
  onOk,
  setOpen,
  onChangeValues,
}: {
  onOk?: (values: ValuesCardAgregarProductoVenta) => void
  setOpen: (open: boolean) => void
  onChangeValues?: (values: ValuesCardAgregarProductoVenta) => void
}) {
  const [values, setValues] =
    useState<ValuesCardAgregarProductoVenta>(valuesDefault)

  const [openModalBuscarPaquete, setOpenModalBuscarPaquete] = useState(false)
  const [openModalTipoPrecioPaquete, setOpenModalTipoPrecioPaquete] = useState(false)
  const [tipoPrecioPaquete, setTipoPrecioPaquete] = useState<TipoPrecio>('publico')
  const [paqueteParaAgregar, setPaqueteParaAgregar] = useState<any>(null)

  const setProductoAgregadoVenta = useStoreProductoAgregadoVenta(
    (store) => store.setProductoAgregado
  )

  const paqueteSeleccionadoStore = useStorePaqueteSeleccionado(s => s.paquete)

  const handleSeleccionarPaquete = async () => {
    if (!paqueteSeleccionadoStore) return
    setOpenModalBuscarPaquete(false)
    const response = await paqueteApi.getById(paqueteSeleccionadoStore.id)
    setPaqueteParaAgregar(response.data?.data ?? paqueteSeleccionadoStore)
    setOpenModalTipoPrecioPaquete(true)
  }

  const tipo_moneda = useStoreProductoAgregadoVenta(
    (store) => store.tipo_moneda
  )

  const handleChange = (
    value: string | number | boolean | null,
    name: string
  ) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const { notification } = App.useApp()

  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    (store) => store.producto
  )
  const confirmCount = useStoreProductoSeleccionadoSearch(
    (store) => store.confirmCount
  )
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)

  // Buscar paquetes que contengan este producto
  const { data: paquetesData } = useQuery({
    queryKey: ['paquetes-by-producto', productoSeleccionadoSearchStore?.id],
    queryFn: async () => {
      if (!productoSeleccionadoSearchStore?.id) return null
      const response = await paqueteApi.getByProducto(productoSeleccionadoSearchStore.id)
      return response.data?.data || []
    },
    enabled: !!productoSeleccionadoSearchStore?.id,
  })

  const paquetes = paquetesData || []
  const tienePaquetes = paquetes.length > 0

  const producto_en_almacen =
    productoSeleccionadoSearchStore?.producto_en_almacenes?.find(
      (item) => item.almacen_id === almacen_id
    )
  const unidades_derivadas = producto_en_almacen?.unidades_derivadas

  function handleOk(closeModal?: boolean) {
    if (!values.cantidad || !values.unidad_derivada_id || !values.precio_venta)
      return notification.error({
        message: 'Complete todos los campos obligatorios',
      })

    const unidad_derivada = unidades_derivadas?.find(
      (item) => item.unidad_derivada.id === values.unidad_derivada_id
    )

    // Mapear directamente desde la key seleccionada por el usuario en SelectPrecios.
    // No inferir por comparación de precio: cuando un producto tiene varios tiers
    // con el mismo precio (ej. publico=especial=minimo=151.50), la comparación
    // siempre matchea el primero y guarda la comision equivocada (ej. publico=0
    // en vez de minimo=9.5). Ver issue venta 21045.
    const precioKey = (values as any).precio_venta_key as
      | 'precio_publico'
      | 'precio_especial'
      | 'precio_minimo'
      | 'precio_ultimo'
      | undefined
    const comisionByKey: Record<string, { comision: string; tipo: string }> = {
      precio_publico: { comision: 'comision_publico', tipo: 'publico' },
      precio_especial: { comision: 'comision_especial', tipo: 'especial' },
      precio_minimo: { comision: 'comision_minimo', tipo: 'minimo' },
      precio_ultimo: { comision: 'comision_ultimo', tipo: 'ultimo' },
    }
    let comision = 0
    let tipo_precio = 'publico'
    if (unidad_derivada && precioKey && comisionByKey[precioKey]) {
      const { comision: comisionField, tipo } = comisionByKey[precioKey]
      comision = Number((unidad_derivada as any)[comisionField] ?? 0)
      tipo_precio = tipo
    }

    const valuesFormated = {
      ...values,
      producto_id: productoSeleccionadoSearchStore?.id,
      producto_name: productoSeleccionadoSearchStore?.name,
      producto_codigo: productoSeleccionadoSearchStore?.cod_producto,
      marca_name: productoSeleccionadoSearchStore?.marca?.name,
      categoria_id: (productoSeleccionadoSearchStore as any)?.categoria_id ?? (productoSeleccionadoSearchStore as any)?.categoria?.id,
      unidad_derivada_name: unidad_derivada?.unidad_derivada.name,
      unidad_derivada_factor: Number(unidad_derivada?.factor),
      precio_venta: values.precio_venta,
      comision,
      tipo_precio,
      stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
      costo: Number((producto_en_almacen as any)?.costo_con_flete ?? producto_en_almacen?.costo ?? 0),
      unidades_derivadas_disponibles: unidades_derivadas,
      producto_en_almacenes: productoSeleccionadoSearchStore?.producto_en_almacenes,
      paquetes_count: paquetes.length,
      img: productoSeleccionadoSearchStore?.img ?? null,
    }

    // Si se proporciona onOk, solo llamarlo (usado por cotizaciones)
    // Si no, actualizar el store de ventas (comportamiento por defecto)
    if (onOk) {
      onOk(valuesFormated)
    } else {
      setProductoAgregadoVenta(valuesFormated)
    }
    if (closeModal) {
      setValues(valuesDefault)
      setOpen(false)
    } else {
      // Al dar "+ MÁS", conservar unidad_derivada_id y precio_venta (permite re-agregar
      // rápido del mismo producto). Si limpiáramos todo, el SelectPrecios queda sin
      // opciones hasta que cambie el producto seleccionado (bug #12).
      setValues((prev) => ({
        ...valuesDefault,
        unidad_derivada_id: prev.unidad_derivada_id,
        precio_venta: prev.precio_venta,
        precio_venta_key: (prev as any).precio_venta_key,
      }))
      setTimeout(() => cantidadRef.current?.focus(), 50)
    }
  }

  const cantidadRef = useRef<InputRef>(null)
  const unidad_derivadaRef = useRef<RefSelectBaseProps>(null)
  const precio_ventaRef = useRef<RefSelectBaseProps>(null)
  const buttom_masRef = useRef<HTMLButtonElement>(null)

  // Enfocar Cantidad cuando llega/cambia el producto seleccionado:
  // - Modal pequeño (header onChange): producto ya está en el store al montar.
  // - Modal grande (BUSCAR PRODUCTO): la tabla auto-selecciona la 1ra fila
  //   ASÍNCRONAMENTE después del fetch, así que necesitamos reaccionar al
  //   cambio del id, no solo al mount.
  // Antes había un guard `usuarioEscribiendo` que bloqueaba el focus cuando
  // activeElement era cualquier INPUT — el SelectProductos del header
  // mantiene el focus, así que el guard impedía siempre el focus en la 2da
  // apertura.
  useEffect(() => {
    if (productoSeleccionadoSearchStore?.id) {
      setTimeout(() => cantidadRef.current?.focus(), 50)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productoSeleccionadoSearchStore?.id])

  // Confirmación explícita del usuario (Enter o click en fila del modal):
  // siempre mover focus a cantidad, sin importar el activeElement.
  // Maneja race con el fetch: si el producto aún no llegó al confirmar,
  // marca pending y enfoca cuando llegue.
  const lastConfirmCountRef = useRef(confirmCount)
  const pendingFocusRef = useRef(false)
  useEffect(() => {
    const confirmCambio = confirmCount !== lastConfirmCountRef.current
    if (confirmCambio) {
      lastConfirmCountRef.current = confirmCount
      if (productoSeleccionadoSearchStore?.id) {
        setTimeout(() => cantidadRef.current?.focus(), 50)
      } else {
        // Producto aún no llegó: enfocar cuando aparezca.
        pendingFocusRef.current = true
      }
    } else if (pendingFocusRef.current && productoSeleccionadoSearchStore?.id) {
      pendingFocusRef.current = false
      setTimeout(() => cantidadRef.current?.focus(), 50)
    }
  }, [confirmCount, productoSeleccionadoSearchStore])
  
  useEffect(() => {
    const primeraUnidad = unidades_derivadas?.[0]?.unidad_derivada?.id
    if (primeraUnidad) {
      unidad_derivadaRef.current?.changeValue(primeraUnidad)
      handleChange(primeraUnidad, 'unidad_derivada_id')

      // Autoseleccionar precio público por defecto
      const precioPublico = unidades_derivadas?.[0]?.precio_publico
      if (precioPublico) {
        handleChange(Number(precioPublico), 'precio_venta')
        handleChange('precio_publico', 'precio_venta_key')
      }
    }
  }, [unidades_derivadas])

  useEffect(() => {
    onChangeValues?.(values)
  }, [values])

  const unidad_derivada_seleccionada = unidades_derivadas?.find(
    (item) => item.unidad_derivada.id === values?.unidad_derivada_id
  )

  return (
    <div className='flex flex-col gap-2'>
      <LabelBase label='Cantidad:' orientation='column'>
        <InputCantidadFraccion
          inputRef={cantidadRef}
          value={values.cantidad}
          factor={Number(unidad_derivada_seleccionada?.factor ?? 1)}
          onChange={(val) => handleChange(val, 'cantidad')}
          onKeyUp={(e) => {
            if (e.key === 'Enter') precio_ventaRef.current?.focus()
          }}
        />
        {/* Stock disponible — siempre visible cuando hay unidad seleccionada */}
        {unidad_derivada_seleccionada && producto_en_almacen && (() => {
          const factor = Number(unidad_derivada_seleccionada.factor)
          const stockDisponible = Number(producto_en_almacen.stock_fraccion)
          const cantidadEnFraccion = Number(values.cantidad ?? 0) * factor
          const excede = !!values.cantidad && cantidadEnFraccion > stockDisponible
          return (
            <div className={`text-xs mt-1 font-medium flex items-center gap-1 ${excede ? 'text-red-600' : 'text-gray-400'}`}>
              {excede ? '⚠️' : ''} Stock:{' '}
              <GetStock stock_fraccion={stockDisponible} unidades_contenidas={factor} />
            </div>
          )
        })()}
      </LabelBase>
      <LabelBase label='Unidad Derivada:' orientation='column'>
        <SelectBase
          ref={unidad_derivadaRef}
          placeholder='Unidad Derivada'
          prefix={<FaWeightHanging size={15} className='text-rose-700 mx-1' />}
          onChange={(value) => {
            handleChange(value, 'unidad_derivada_id')

            // Autoseleccionar precio público de la unidad seleccionada
            const unidadSeleccionada = unidades_derivadas?.find(
              (item) => item.unidad_derivada.id === value
            )
            if (unidadSeleccionada?.precio_publico) {
              handleChange(Number(unidadSeleccionada.precio_publico), 'precio_venta')
              handleChange('precio_publico', 'precio_venta_key')
            } else {
              handleChange(null, 'precio_venta')
              handleChange(null, 'precio_venta_key')
            }
          }}
          className='w-full'
          value={values.unidad_derivada_id}
          options={
            unidades_derivadas?.map((item) => ({
              value: item.unidad_derivada.id,
              label: item.unidad_derivada.name,
            })) || []
          }
        />
      </LabelBase>
      <LabelBase label='Precio Venta:' orientation='column'>
        <SelectPrecios
          unidadDerivada={unidad_derivada_seleccionada}
          cantidad={Number(values.cantidad || 0)}
          ref={precio_ventaRef}
          placeholder='Precio Venta'
          onChange={(precio, key) => {
            handleChange(precio, 'precio_venta')
            handleChange(key, 'precio_venta_key')
          }}
          className='w-full'
          classNameIcon='text-rose-700'
          value={(values as any).precio_venta_key ?? null}
          nextInEnter={false}
          onKeyUp={(e) => {
            if (e.key === 'Enter') buttom_masRef.current?.focus()
          }}
        />
      </LabelBase>
      <LabelBase label='Recargo:' orientation='column'>
        <InputNumberBase
          placeholder='Recargo'
          precision={4}
          prefix={
            <FaMoneyBillTrendUp size={15} className={`text-cyan-600 mx-1`} />
          }
          onChange={(value) => handleChange(value, 'recargo')}
          value={values.recargo}
          min={0}
        />
      </LabelBase>
      <LabelBase label='Descuento:' orientation='column'>
        <div className='flex items-center gap-1'>
          <SelectDescuentoTipo
            value={values.descuento_tipo}
            onChange={(value) => handleChange(value, 'descuento_tipo')}
            formWithMessage={false}
          />
          <InputNumberBase
            placeholder='Descuento'
            precision={values.descuento_tipo === DescuentoTipo.PORCENTAJE ? 2 : 4}
            prefix={
              values.descuento_tipo === DescuentoTipo.PORCENTAJE 
                ? undefined 
                : <FaPiggyBank size={15} className={`text-cyan-600 mx-1`} />
            }
            suffix={values.descuento_tipo === DescuentoTipo.PORCENTAJE ? '%' : undefined}
            onChange={(value) => handleChange(value, 'descuento')}
            value={values.descuento}
            min={0}
            max={values.descuento_tipo === DescuentoTipo.PORCENTAJE ? 100 : undefined}
          />
        </div>
      </LabelBase>
      <div className='flex items-center justify-between text-2xl font-bold my-2'>
        <div className='text-slate-500'>Total:</div>
        <div>
          {tipo_moneda === TipoMoneda.SOLES ? `S/.` : `$.`}
          {calcularSubtotalVenta({
            precio_venta: values.precio_venta ?? 0,
            recargo: values.recargo ?? 0,
            cantidad: values.cantidad ?? 0,
            descuento: values.descuento ?? 0,
            descuento_tipo: values.descuento_tipo || DescuentoTipo.MONTO,
          }).toFixed(2)}
        </div>
      </div>

      <div className='flex items-center justify-between gap-2'>
        <ButtonBase
          ref={buttom_masRef}
          color='success'
          className='flex items-center justify-center gap-3 !rounded-md w-full h-full text-balance px-4! hover:!scale-100'
          onClick={() => handleOk(false)}
        >
          <FaPlusCircle className='min-w-fit' size={12} /> Más
        </ButtonBase>
        <ButtonBase
          color='warning'
          className='flex items-center justify-center gap-3 !rounded-md w-full h-full text-nowrap px-4! hover:!scale-100'
          onClick={() => handleOk(true)}
        >
          <FaPlusCircle className='min-w-fit' size={12} /> Más y Salir
        </ButtonBase>
      </div>

      {/* Badge de paquetes disponibles */}
      {tienePaquetes && (
        <div className='mt-2 w-full'>
          <Button
            type="dashed"
            icon={<FaBoxOpen />}
            onClick={() => setOpenModalBuscarPaquete(true)}
            className='w-full'
            style={{ overflow: 'hidden' }}
          >
            <div className='flex items-center justify-center gap-2 overflow-hidden'>
              <span>🎁 Disponible en {paquetes.length} paquete{paquetes.length > 1 ? 's' : ''}</span>
            </div>
          </Button>
        </div>
      )}

      {/* Modal completo de búsqueda de paquetes */}
      <ModalBuscarPaquete
        open={openModalBuscarPaquete}
        setOpen={setOpenModalBuscarPaquete}
        textDefault={''}
        rowDataOverride={paquetes}
        onOk={handleSeleccionarPaquete}
        onRowDoubleClicked={async ({ data }) => {
          if (!data) return
          setOpenModalBuscarPaquete(false)
          const response = await paqueteApi.getById(data.id)
          setPaqueteParaAgregar(response.data?.data ?? data)
          setOpenModalTipoPrecioPaquete(true)
        }}
      />

      <Modal
        open={openModalTipoPrecioPaquete}
        onCancel={() => setOpenModalTipoPrecioPaquete(false)}
        title="Selecciona el tipo de precio"
        okText="Agregar al carrito"
        cancelText="Cancelar"
        onOk={async () => {
          if (!paqueteParaAgregar?.productos?.length) {
            notification.warning({ message: 'Paquete vacío' })
            return
          }

          const precioKey = `precio_${tipoPrecioPaquete}`
          const descuentoKey = `descuento_${tipoPrecioPaquete}`

          // Calcular precio unitario del paquete (suma de precios de sub-productos × cantidad base)
          let precioPaqueteUnitario = 0
          for (const pp of paqueteParaAgregar.productos) {
            if (pp.producto && pp.unidad_derivada) {
              const precio = Number((pp as any)[precioKey] || 0)
              const descuento = Number((pp as any)[descuentoKey] || 0)
              precioPaqueteUnitario += (precio - descuento) * Number(pp.cantidad)
            }
          }

          // ID único por instancia: distingue dos paquetes del mismo tipo en la misma venta
          const paqueteInstanceId = Date.now()

          // 1. Agregar fila cabecera del paquete
          setProductoAgregadoVenta({
            _tipo_fila: 'paquete_cabecera',
            producto_id: paqueteParaAgregar.id,
            producto_name: paqueteParaAgregar.nombre,
            producto_codigo: '',
            marca_name: '',
            unidad_derivada_id: 0,
            unidad_derivada_name: '',
            unidad_derivada_factor: 1,
            cantidad: 1,
            cantidad_paquete: 1,
            precio_venta: precioPaqueteUnitario,
            recargo: 0,
            descuento: 0,
            descuento_tipo: DescuentoTipo.MONTO,
            subtotal: precioPaqueteUnitario,
            comision: 0,
            paquete_id: paqueteParaAgregar.id,
            paquete_instance_id: paqueteInstanceId,
            paquete_nombre: paqueteParaAgregar.nombre,
            tipo_precio: tipoPrecioPaquete,
          } as any)
          await new Promise(resolve => setTimeout(resolve, 50))

          // 2. Agregar sub-productos
          let productosAgregados = 0
          for (const paqueteProducto of paqueteParaAgregar.productos) {
            if (paqueteProducto.producto && paqueteProducto.unidad_derivada) {
              const precio = Number((paqueteProducto as any)[precioKey] || 0)
              const descuento = Number((paqueteProducto as any)[descuentoKey] || 0)
              const cantidadBase = Number(paqueteProducto.cantidad)

              // Buscar stock y factor real del sub-producto para el almacén activo
              const productoEnAlmacen = paqueteProducto.producto.producto_en_almacenes?.find(
                (a: any) => a.almacen_id === almacen_id
              )
              const stockFraccion = Number(productoEnAlmacen?.stock_fraccion ?? 0)
              const unidadDerivadaReal = productoEnAlmacen?.unidades_derivadas?.find(
                (u: any) => (u.unidad_derivada_id ?? u.unidad_derivada?.id) === paqueteProducto.unidad_derivada_id
              )
              const factorReal = Number(unidadDerivadaReal?.factor ?? 1)

              // Crear objeto con todos los precios y descuentos de todos los tipos
              const productoData = {
                _tipo_fila: 'paquete_producto',
                producto_id: paqueteProducto.producto_id,
                producto_name: paqueteProducto.producto.name,
                producto_codigo: paqueteProducto.producto.cod_producto,
                marca_name: paqueteProducto.producto.marca?.name || '',
                unidad_derivada_id: paqueteProducto.unidad_derivada_id,
                unidad_derivada_name: paqueteProducto.unidad_derivada.name,
                unidad_derivada_factor: factorReal,
                stock_fraccion: stockFraccion,
                cantidad: cantidadBase,
                cantidad_base: cantidadBase,
                precio_venta: precio,
                recargo: 0,
                descuento: descuento,
                descuento_tipo: DescuentoTipo.MONTO,
                subtotal: (precio - descuento) * cantidadBase,
                comision: 0,
                paquete_id: paqueteParaAgregar.id,
                paquete_instance_id: paqueteInstanceId,
                paquete_nombre: paqueteParaAgregar.nombre,
                tipo_precio: tipoPrecioPaquete,
                img: paqueteProducto.producto.img ?? null,
                // Guardar TODOS los precios y descuentos de todos los tipos
                // Estos se usan cuando el usuario cambia el tipo de precio
                paq_precio_publico: Number(paqueteProducto.precio_publico || 0),
                paq_precio_especial: Number(paqueteProducto.precio_especial || 0),
                paq_precio_minimo: Number(paqueteProducto.precio_minimo || 0),
                paq_precio_ultimo: Number(paqueteProducto.precio_ultimo || 0),
                paq_descuento_publico: Number((paqueteProducto as any).descuento_publico || 0),
                paq_descuento_especial: Number((paqueteProducto as any).descuento_especial || 0),
                paq_descuento_minimo: Number((paqueteProducto as any).descuento_minimo || 0),
                paq_descuento_ultimo: Number((paqueteProducto as any).descuento_ultimo || 0),
              } as any
              
              setProductoAgregadoVenta(productoData)
              productosAgregados++
              await new Promise(resolve => setTimeout(resolve, 50))
            }
          }

          notification.success({
            message: 'Paquete agregado',
            description: `Se agregaron ${productosAgregados} producto${productosAgregados !== 1 ? 's' : ''} del paquete "${paqueteParaAgregar.nombre}"`,
          })

          setOpenModalTipoPrecioPaquete(false)
          setOpenModalBuscarPaquete(false)
          setOpen(false)
        }}
        width={350}
        centered
      >
        <div className="py-4">
          <p className="text-gray-600 mb-3">
            Paquete: <strong>{paqueteParaAgregar?.nombre}</strong>
          </p>
          <Radio.Group
            value={tipoPrecioPaquete}
            onChange={(e) => setTipoPrecioPaquete(e.target.value)}
            className="flex flex-col gap-2"
          >
            <Radio value="publico">Precio Público</Radio>
            <Radio value="especial">Precio Ferretería</Radio>
            <Radio value="minimo">Precio Minimo</Radio>
            <Radio value="ultimo">Precio Final</Radio>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  )
}
