import { useEffect, useState } from 'react'
import { FaBoxes, FaPlusCircle } from 'react-icons/fa'
import {
  FaMoneyBill,
  FaTruck,
  FaTruckRampBox,
  FaWeightHanging,
} from 'react-icons/fa6'
import { TbAlertTriangleFilled } from 'react-icons/tb'
import CheckboxBase from '~/app/_components/form/checkbox/checkbox-base'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import { toLocalString } from '~/utils/fechas'
import dayjs from 'dayjs'
import { App } from 'antd'
import { GetStock } from '~/app/_utils/get-stock'
import { calcularNuevoStock } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/others/stock-ingreso-salida'
import { useStoreProductoAgregadoCompra } from '~/app/_stores/store-producto-agregado-compra'
import { FormCreateCompra } from '../others/body-comprar'

export type ValuesCardAgregarProductoCompra = Partial<
  FormCreateCompra['productos'][number]
>

export const valuesDefault: ValuesCardAgregarProductoCompra = {
  cantidad: undefined,
  unidad_derivada_id: undefined,
  precio_compra: undefined,
  lote: undefined,
  vencimiento: undefined,
  bonificacion: false,

  producto_id: undefined,
  producto_name: undefined,
  marca_name: undefined,
  unidad_derivada_name: undefined,
}

export default function CardAgregarProductoCompra({
  onOk,
  setOpen,
}: {
  onOk?: (values: ValuesCardAgregarProductoCompra) => void
  setOpen: (open: boolean) => void
}) {
  const [values, setValues] =
    useState<ValuesCardAgregarProductoCompra>(valuesDefault)

  const setProductoAgregadoCompra = useStoreProductoAgregadoCompra(
    store => store.setProductoAgregado
  )

  const handleChange = (
    value: string | number | boolean | null,
    name: string
  ) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }

  const { notification } = App.useApp()

  const productoSeleccionadoSearchStore = useStoreProductoSeleccionadoSearch(
    store => store.producto
  )
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const producto_en_almacen =
    productoSeleccionadoSearchStore?.producto_en_almacenes?.find(
      item => item.almacen_id === almacen_id
    )
  const unidades_derivadas = producto_en_almacen?.unidades_derivadas

  function handleOk(closeModal?: boolean) {
    if (
      !values.cantidad ||
      !values.unidad_derivada_id ||
      (!values.bonificacion && !values.precio_compra)
    )
      return notification.error({
        message: 'Complete todos los campos obligatorios',
      })

    const unidad_derivada = unidades_derivadas?.find(
      item => item.unidad_derivada.id === values.unidad_derivada_id
    )

    const valuesFormated = {
      ...values,
      producto_id: productoSeleccionadoSearchStore?.id,
      producto_name: productoSeleccionadoSearchStore?.name,
      marca_name: productoSeleccionadoSearchStore?.marca?.name,
      unidad_derivada_name: unidad_derivada?.unidad_derivada.name,
      unidad_derivada_factor: unidad_derivada?.factor,
      precio_compra: values.bonificacion ? 0 : values.precio_compra,
    }

    onOk?.(valuesFormated)
    setValues(valuesDefault)
    setProductoAgregadoCompra(valuesFormated)
    if (closeModal) setOpen(false)
  }

  useEffect(() => {
    handleChange(null, 'unidad_derivada_id')
  }, [unidades_derivadas])

  return (
    <div className='flex flex-col gap-2'>
      <LabelBase label='Cantidad:' orientation='column'>
        <InputNumberBase
          placeholder='Cantidad'
          precision={2}
          prefix={<FaBoxes size={15} className='text-rose-700 mx-1' />}
          onChange={value => handleChange(value, 'cantidad')}
          value={values.cantidad}
          min={0}
        />
      </LabelBase>
      <LabelBase label='Unidad Derivada:' orientation='column'>
        <SelectBase
          placeholder='Unidad Derivada'
          prefix={<FaWeightHanging size={15} className='text-rose-700 mx-1' />}
          onChange={value => handleChange(value, 'unidad_derivada_id')}
          className='w-full'
          value={values.unidad_derivada_id}
          options={
            unidades_derivadas?.map(item => ({
              value: item.unidad_derivada.id,
              label: item.unidad_derivada.name,
            })) || []
          }
        />
      </LabelBase>
      <LabelBase label='P. Compra:' orientation='column'>
        <InputNumberBase
          placeholder='P. Compra'
          precision={4}
          prefix={
            <FaMoneyBill
              size={15}
              className={`${
                values.bonificacion ? 'text-cyan-600' : 'text-rose-700'
              } mx-1`}
            />
          }
          disabled={values.bonificacion}
          onChange={value => handleChange(value, 'precio_compra')}
          value={values.precio_compra}
          min={0}
        />
      </LabelBase>
      <LabelBase label='Flete:' orientation='column'>
        <InputNumberBase
          placeholder='Flete'
          precision={4}
          prefix={<FaTruck size={15} className='text-cyan-600 mx-1' />}
          onChange={value => handleChange(value, 'flete')}
          value={values.flete}
          min={0}
        />
      </LabelBase>
      <LabelBase label='N° Lote:' orientation='column'>
        <InputBase
          placeholder='N° Lote'
          prefix={<FaTruckRampBox size={15} className='text-cyan-600 mx-1' />}
          onChange={e => handleChange(e.target.value, 'lote')}
          value={values.lote || ''}
        />
      </LabelBase>
      <LabelBase label='Vencimiento:' orientation='column'>
        <DatePickerBase
          placeholder='Vencimiento'
          prefix={
            <TbAlertTriangleFilled size={15} className='text-cyan-600 mx-1' />
          }
          onChange={value =>
            handleChange(
              toLocalString({
                date: value,
              }) || null,
              'vencimiento'
            )
          }
          value={values.vencimiento ? dayjs(values.vencimiento).local() : null}
        />
      </LabelBase>
      <CheckboxBase
        onChange={e => handleChange(e.target.checked, 'bonificacion')}
        checked={values.bonificacion}
      >
        Bonificación
      </CheckboxBase>
      <div className='flex items-center justify-between text-2xl font-bold my-2'>
        <div className='text-slate-500'>Total:</div>
        <div>
          <GetStock
            stock_fraccion={calcularNuevoStock({
              stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
              cantidad: values.cantidad ?? 0,
              factor: Number(
                unidades_derivadas?.find(
                  item => item.id === values.unidad_derivada_id
                )?.factor ?? 1
              ),
            })}
            unidades_contenidas={Number(
              productoSeleccionadoSearchStore?.unidades_contenidas ?? 0
            )}
          />
        </div>
      </div>

      <div className='flex items-center justify-between gap-2'>
        <ButtonBase
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
