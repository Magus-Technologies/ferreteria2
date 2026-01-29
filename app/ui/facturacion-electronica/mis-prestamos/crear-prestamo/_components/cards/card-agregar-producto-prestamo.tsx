/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useRef, useState } from 'react'
import { FaBoxes, FaPlusCircle } from 'react-icons/fa'
import { FaWeightHanging } from 'react-icons/fa6'
// import { FaMoneyBillTrendUp } from 'react-icons/fa6' // Comentado: Solo se maneja por cantidad
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase, {
  RefSelectBaseProps,
} from '~/app/_components/form/selects/select-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import { App } from 'antd'
import { FormCreatePrestamo } from '../../_types/prestamo.types'
import { useStoreProductoAgregadoPrestamo } from '../../_store/store-producto-agregado-prestamo'
// import { TipoMoneda } from '~/lib/api/prestamo' // Comentado: Solo se maneja por cantidad

export type ValuesCardAgregarProductoPrestamo = Partial<
  FormCreatePrestamo['productos'][number]
>

export const valuesDefault: ValuesCardAgregarProductoPrestamo = {
  cantidad: undefined,
  unidad_derivada_id: undefined,
  // costo: undefined, // Comentado: Solo se maneja por cantidad

  producto_id: undefined,
  producto_name: undefined,
  marca_name: undefined,
  unidad_derivada_name: undefined,
}

export default function CardAgregarProductoPrestamo({
  setOpen,
}: {
  setOpen: (open: boolean) => void
}) {
  const [values, setValues] =
    useState<ValuesCardAgregarProductoPrestamo>(valuesDefault)

  const setProductoAgregadoPrestamo = useStoreProductoAgregadoPrestamo(
    (store) => store.setProductoAgregado
  )

  // const tipo_moneda = useStoreProductoAgregadoPrestamo(
  //   (store) => store.tipo_moneda
  // ) // Comentado: Solo se maneja por cantidad

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
    if (!values.cantidad || !values.unidad_derivada_id)
      return notification.error({
        message: 'Complete todos los campos obligatorios',
      })

    if (!productoSeleccionadoSearchStore?.id) {
      return notification.error({
        message: 'Seleccione un producto válido',
      })
    }

    const unidad_derivada = unidades_derivadas?.find(
      (item) => item.unidad_derivada.id === values.unidad_derivada_id
    )

    const valuesFormated: FormCreatePrestamo['productos'][number] = {
      producto_id: productoSeleccionadoSearchStore.id,
      producto_name: productoSeleccionadoSearchStore.name ?? '',
      producto_codigo: productoSeleccionadoSearchStore.cod_producto ?? '',
      marca_name: productoSeleccionadoSearchStore.marca?.name ?? '',
      unidad_derivada_id: values.unidad_derivada_id,
      unidad_derivada_name: unidad_derivada?.unidad_derivada.name ?? '',
      unidad_derivada_factor: Number(unidad_derivada?.factor ?? 1),
      cantidad: values.cantidad,
      // costo: values.costo, // Comentado: Solo se maneja por cantidad
      // subtotal: values.cantidad * values.costo, // Comentado: Solo se maneja por cantidad
    }

    setProductoAgregadoPrestamo(valuesFormated)
    setValues(valuesDefault)
    if (closeModal) setOpen(false)
  }

  const cantidadRef = useRef<HTMLInputElement>(null)
  const unidad_derivadaRef = useRef<RefSelectBaseProps>(null)
  // const costoRef = useRef<HTMLInputElement>(null) // Comentado: Solo se maneja por cantidad
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
          prefix={<FaBoxes size={15} className='text-amber-600 mx-1' />}
          onChange={(value) => handleChange(value, 'cantidad')}
          value={values.cantidad}
          min={0}
          nextInEnter={false}
          onKeyUp={(e) => {
            if (e.key === 'Enter') buttom_masRef.current?.focus()
          }}
        />
        {/* Validación de stock */}
        {values.cantidad && unidad_derivada_seleccionada && producto_en_almacen && (() => {
          const cantidadEnFraccion = Number(values.cantidad) * Number(unidad_derivada_seleccionada.factor);
          const stockDisponible = Number(producto_en_almacen.stock_fraccion);
          const stockEnUnidad = stockDisponible / Number(unidad_derivada_seleccionada.factor);

          if (cantidadEnFraccion > stockDisponible) {
            return (
              <div className='text-red-600 text-sm mt-1 font-medium'>
                ⚠️ Stock insuficiente. Disponible: {stockEnUnidad.toFixed(2)} {unidad_derivada_seleccionada.unidad_derivada.name}
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
          prefix={<FaWeightHanging size={15} className='text-amber-600 mx-1' />}
          onChange={(value) => {
            handleChange(value, 'unidad_derivada_id')
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
      {/* Comentado: Solo se maneja por cantidad
      <LabelBase label='Costo:' orientation='column'>
        <InputNumberBase
          ref={costoRef}
          placeholder='Costo'
          precision={4}
          prefix={
            <FaMoneyBillTrendUp size={15} className='text-amber-600 mx-1' />
          }
          onChange={(value) => handleChange(value, 'costo')}
          value={values.costo}
          min={0}
          nextInEnter={false}
          onKeyUp={(e) => {
            if (e.key === 'Enter') buttom_masRef.current?.focus()
          }}
        />
      </LabelBase>
      <div className='flex items-center justify-between text-2xl font-bold my-2'>
        <div className='text-slate-500'>Total:</div>
        <div>
          {tipo_moneda === TipoMoneda.SOLES ? `S/.` : `$.`}
          {((values.costo ?? 0) * (values.cantidad ?? 0)).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
      */}

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
    </div>
  )
}
