/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import { FaBoxes, FaPiggyBank, FaPlusCircle } from 'react-icons/fa'
import { FaMoneyBillTrendUp, FaWeightHanging } from 'react-icons/fa6'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase, {
  RefSelectBaseProps,
} from '~/app/_components/form/selects/select-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import { App } from 'antd'
import { FormCreateVenta } from '../others/body-vender'
import { useStoreProductoAgregadoVenta } from '../../_store/store-producto-agregado-venta'
import SelectDescuentoTipo from '~/app/_components/form/selects/select-descuento-tipo'
import { DescuentoTipo, TipoMoneda } from '@prisma/client'
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
  descuento_tipo: undefined,
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
    }

    onOk?.(valuesFormated)
    setValues(valuesDefault)
    setProductoAgregadoVenta(valuesFormated)
    if (closeModal) setOpen(false)
  }

  const cantidadRef = useRef<HTMLInputElement>(null)
  const unidad_derivadaRef = useRef<RefSelectBaseProps>(null)
  const precio_ventaRef = useRef<RefSelectBaseProps>(null)
  const buttom_masRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cantidadRef.current?.focus()
  }, [productoSeleccionadoSearchStore])
  useEffect(() => {
    const primeraUnidad = unidades_derivadas?.[0]?.unidad_derivada?.id
    if (primeraUnidad) {
      unidad_derivadaRef.current?.changeValue(primeraUnidad)
      handleChange(primeraUnidad, 'unidad_derivada_id')
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
          onKeyUp={(e) => {
            if (e.key === 'Enter') precio_ventaRef.current?.focus()
          }}
        />
      </LabelBase>
      <LabelBase label='Unidad Derivada:' orientation='column'>
        <SelectBase
          ref={unidad_derivadaRef}
          placeholder='Unidad Derivada'
          prefix={<FaWeightHanging size={15} className='text-rose-700 mx-1' />}
          onChange={(value) => {
            handleChange(value, 'unidad_derivada_id')
            handleChange(null, 'precio_venta')
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
            precision={4}
            prefix={<FaPiggyBank size={15} className={`text-cyan-600 mx-1`} />}
            onChange={(value) => handleChange(value, 'descuento')}
            value={values.descuento}
            min={0}
          />
        </div>
      </LabelBase>
      <div className='flex items-center justify-between text-2xl font-bold my-2'>
        <div className='text-slate-500'>Total:</div>
        <div>
          {tipo_moneda === TipoMoneda.Soles ? `S/.` : `$.`}
          {calcularSubtotalVenta({
            precio_venta: values.precio_venta ?? 0,
            recargo: values.recargo ?? 0,
            cantidad: values.cantidad ?? 0,
            descuento: values.descuento ?? 0,
            descuento_tipo: values.descuento_tipo || DescuentoTipo.Monto,
          })}
        </div>
      </div>

      <div className='flex items-center justify-between gap-2'>
        <ButtonBase
          ref={buttom_masRef}
          color='success'
          className='flex items-center justify-center gap-3 !rounded-md w-full h-full text-balance px-4!'
          onClick={() => handleOk(false)}
        >
          <FaPlusCircle className='min-w-fit' size={12} /> Más
        </ButtonBase>
        <ButtonBase
          color='warning'
          className='flex items-center justify-center gap-3 !rounded-md w-full h-full text-nowrap px-4!'
          onClick={() => handleOk(true)}
        >
          <FaPlusCircle className='min-w-fit' size={12} /> Más y Salir
        </ButtonBase>
      </div>
    </div>
  )
}
