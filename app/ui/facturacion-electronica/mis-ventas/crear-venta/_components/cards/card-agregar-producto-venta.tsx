/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
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
import { App, Badge, Button, Modal } from 'antd'
import { FormCreateVenta } from '../others/body-vender'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import SelectDescuentoTipo from '~/app/_components/form/selects/select-descuento-tipo'
import { DescuentoTipo, TipoMoneda } from '~/lib/api/venta'
import SelectPrecios from '~/app/_components/form/selects/select-precios'
import { calcularSubtotalVenta } from '../tables/columns-vender'

export type ValuesCardAgregarProductoVenta = Partial<
  FormCreateVenta['productos'][number]
>

export const valuesDefault: ValuesCardAgregarProductoVenta = {
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

  const [openModalPaquetes, setOpenModalPaquetes] = useState(false)

  const setProductoAgregadoVenta = useStoreProductoAgregadoVenta(
    (store) => store.setProductoAgregado
  )

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

    let comision = 0
    if (unidad_derivada) {
      if (
        Number(unidad_derivada.precio_publico) === Number(values.precio_venta)
      ) {
        comision = Number(unidad_derivada.comision_publico ?? 0)
      } else if (
        Number(unidad_derivada.precio_especial) === Number(values.precio_venta)
      ) {
        comision = Number(unidad_derivada.comision_especial ?? 0)
      } else if (
        Number(unidad_derivada.precio_minimo) === Number(values.precio_venta)
      ) {
        comision = Number(unidad_derivada.comision_minimo ?? 0)
      } else if (
        Number(unidad_derivada.precio_ultimo) === Number(values.precio_venta)
      ) {
        comision = Number(unidad_derivada.comision_ultimo ?? 0)
      }
    }

    const valuesFormated = {
      ...values,
      producto_id: productoSeleccionadoSearchStore?.id,
      producto_name: productoSeleccionadoSearchStore?.name,
      producto_codigo: productoSeleccionadoSearchStore?.cod_producto,
      marca_name: productoSeleccionadoSearchStore?.marca?.name,
      unidad_derivada_name: unidad_derivada?.unidad_derivada.name,
      unidad_derivada_factor: Number(unidad_derivada?.factor),
      precio_venta: values.precio_venta,
      comision,
      stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
      // Guardar las unidades derivadas disponibles del producto
      unidades_derivadas_disponibles: unidades_derivadas,
    }

    // Si se proporciona onOk, solo llamarlo (usado por cotizaciones)
    // Si no, actualizar el store de ventas (comportamiento por defecto)
    if (onOk) {
      onOk(valuesFormated)
    } else {
      setProductoAgregadoVenta(valuesFormated)
    }
    setValues(valuesDefault)
    if (closeModal) setOpen(false)
  }

  const cantidadRef = useRef<HTMLInputElement>(null)
  const unidad_derivadaRef = useRef<RefSelectBaseProps>(null)
  const precio_ventaRef = useRef<RefSelectBaseProps>(null)
  const buttom_masRef = useRef<HTMLButtonElement>(null)
  const lastProductoIdRef = useRef<number | undefined>(undefined)
  
  useEffect(() => {
    // Solo enfocar si el producto cambió Y no es la primera vez (para evitar autofocus al abrir modal)
    if (productoSeleccionadoSearchStore?.id && 
        productoSeleccionadoSearchStore.id !== lastProductoIdRef.current &&
        lastProductoIdRef.current !== undefined) {
      // Pequeño delay para permitir que la tabla procese la selección primero
      setTimeout(() => {
        cantidadRef.current?.focus()
      }, 50)
    }
    lastProductoIdRef.current = productoSeleccionadoSearchStore?.id
  }, [productoSeleccionadoSearchStore])
  
  useEffect(() => {
    const primeraUnidad = unidades_derivadas?.[0]?.unidad_derivada?.id
    if (primeraUnidad) {
      unidad_derivadaRef.current?.changeValue(primeraUnidad)
      handleChange(primeraUnidad, 'unidad_derivada_id')

      // Autoseleccionar precio público por defecto
      const precioPublico = unidades_derivadas?.[0]?.precio_publico
      if (precioPublico) {
        handleChange(Number(precioPublico), 'precio_venta')
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
        <InputNumberBase
          ref={cantidadRef}
          placeholder='Cantidad'
          precision={2}
          prefix={<FaBoxes size={15} className='text-rose-700 mx-1' />}
          onChange={(value) => handleChange(value, 'cantidad')}
          value={values.cantidad}
          min={0}
          nextInEnter={false}
          controls={false}
          keyboard={false}
          onKeyUp={(e) => {
            if (e.key === 'Enter') precio_ventaRef.current?.focus()
          }}
        />
        {/* Validación de stock */}
        {values.cantidad && unidad_derivada_seleccionada && producto_en_almacen && (() => {
          const cantidadEnFraccion = Number(values.cantidad) * Number(unidad_derivada_seleccionada.factor);
          const stockDisponible = Number(producto_en_almacen.stock_fraccion);
          const stockEnUnidad = stockDisponible / Number(unidad_derivada_seleccionada.factor);
          
          if (cantidadEnFraccion > stockDisponible) {
            return (
              <div className='text-red-600 text-xs mt-1 font-medium'>
                ⚠️ Stock: {stockEnUnidad.toFixed(2)}
              </div>
            );
          }
          return null;
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
            } else {
              handleChange(null, 'precio_venta')
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
      <LabelBase label='P. Venta:' orientation='column'>
        <SelectPrecios
          unidadDerivada={unidad_derivada_seleccionada}
          ref={precio_ventaRef}
          placeholder='P. Venta'
          onChange={(value) => handleChange(value, 'precio_venta')}
          className='w-full'
          classNameIcon='text-rose-700'
          value={values.precio_venta}
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
          })}
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
        <div className='mt-2'>
          <Badge count={paquetes.length} showZero={false}>
            <Button
              type="dashed"
              icon={<FaBoxOpen />}
              onClick={() => setOpenModalPaquetes(true)}
              className='w-full'
            >
              🎁 Disponible en {paquetes.length} paquete{paquetes.length > 1 ? 's' : ''}
            </Button>
          </Badge>
        </div>
      )}

      {/* Modal para seleccionar paquete */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <FaBoxOpen className="text-cyan-600" />
            <span>Paquetes disponibles</span>
          </div>
        }
        open={openModalPaquetes}
        onCancel={() => setOpenModalPaquetes(false)}
        footer={null}
        width={600}
      >
        <div className="space-y-2">
          <p className="text-gray-600 mb-4">
            Este producto está incluido en los siguientes paquetes. Selecciona uno para agregar todos sus productos a la venta:
          </p>
          {paquetes.map((paquete) => (
            <div
              key={paquete.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => {
                // Agregar todos los productos del paquete a la venta
                const agregarPaqueteCompleto = async () => {
                  if (!paquete.productos || paquete.productos.length === 0) {
                    notification.warning({
                      message: 'Paquete vacío',
                      description: 'Este paquete no tiene productos',
                    })
                    return
                  }

                  let productosAgregados = 0

                  // Agregar cada producto del paquete
                  for (const paqueteProducto of paquete.productos) {
                    if (paqueteProducto.producto && paqueteProducto.unidad_derivada) {
                      setProductoAgregadoVenta({
                        producto_id: paqueteProducto.producto_id,
                        producto_name: paqueteProducto.producto.name,
                        producto_codigo: paqueteProducto.producto.cod_producto,
                        marca_name: paqueteProducto.producto.marca?.name || '',
                        unidad_derivada_id: paqueteProducto.unidad_derivada_id,
                        unidad_derivada_name: paqueteProducto.unidad_derivada.name,
                        unidad_derivada_factor: 1,
                        cantidad: Number(paqueteProducto.cantidad),
                        precio_venta: Number(paqueteProducto.precio_sugerido || 0),
                        recargo: 0,
                        descuento: 0,
                        descuento_tipo: DescuentoTipo.MONTO,
                        subtotal: 0,
                        comision: 0,
                      })

                      productosAgregados++
                      // Pequeño delay para que se procesen los productos
                      await new Promise(resolve => setTimeout(resolve, 50))
                    }
                  }

                  notification.success({
                    message: 'Paquete agregado',
                    description: `Se agregaron ${productosAgregados} producto${productosAgregados !== 1 ? 's' : ''} del paquete "${paquete.nombre}"`,
                  })

                  setOpenModalPaquetes(false)
                  setOpen(false) // Cerrar también el modal de agregar producto
                }

                agregarPaqueteCompleto()
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{paquete.nombre}</h4>
                  {paquete.descripcion && (
                    <p className="text-sm text-gray-500">{paquete.descripcion}</p>
                  )}
                </div>
                <Badge
                  count={paquete.productos_count || paquete.productos?.length || 0}
                  showZero
                  style={{ backgroundColor: '#52c41a' }}
                  title="Cantidad de productos"
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
