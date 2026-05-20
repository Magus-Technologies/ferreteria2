/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
import { FaBoxes, FaPlusCircle } from 'react-icons/fa'
import { FaWeightHanging } from 'react-icons/fa6'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectBase, {
  RefSelectBaseProps,
} from '~/app/_components/form/selects/select-base'
import { useStoreProductoSeleccionadoSearch } from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_store/store-producto-seleccionado-search'
import ButtonBase from '~/components/buttons/button-base'
import LabelBase from '~/components/form/label-base'
import { useStoreAlmacen } from '~/store/store-almacen'
import { App } from 'antd'
import {
  useStoreProductoAgregadoTransferencia,
  type ValuesCardAgregarProductoTransferencia,
} from '../../_store/store-producto-agregado-transferencia'
import { getStock } from '~/app/_utils/get-stock'

const valuesDefault: ValuesCardAgregarProductoTransferencia = {
  cantidad: undefined,
  unidad_derivada_id: undefined,
  producto_id: undefined,
  producto_name: undefined,
  cod_producto: undefined,
  unidad_derivada_name: undefined,
}

export default function CardAgregarProductoTransferencia({
  setOpen,
  almacenOrigenId,
}: {
  setOpen: (open: boolean) => void
  almacenOrigenId?: number
}) {
  const [values, setValues] =
    useState<ValuesCardAgregarProductoTransferencia>(valuesDefault)

  const setProductoAgregado = useStoreProductoAgregadoTransferencia(
    (store) => store.setProductoAgregado
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
  const almacen_id_store = useStoreAlmacen((store) => store.almacen_id)
  const almacen_id = almacenOrigenId ?? almacen_id_store

  const producto_en_almacen =
    productoSeleccionadoSearchStore?.producto_en_almacenes?.find(
      (item) => item.almacen_id === almacen_id
    ) ?? productoSeleccionadoSearchStore?.producto_en_almacenes?.[0]

  const unidades_derivadas = producto_en_almacen?.unidades_derivadas

  function handleOk(closeModal?: boolean) {
    if (!values.cantidad || !values.unidad_derivada_id)
      return notification.error({
        message: 'Complete cantidad y unidad derivada',
      })

    const unidad_derivada = unidades_derivadas?.find(
      (item) => item.unidad_derivada.id === values.unidad_derivada_id
    )

    const valuesFormated: ValuesCardAgregarProductoTransferencia = {
      ...values,
      producto_id: productoSeleccionadoSearchStore?.id,
      producto_name: productoSeleccionadoSearchStore?.name,
      cod_producto: productoSeleccionadoSearchStore?.cod_producto,
      unidad_derivada_name: unidad_derivada?.unidad_derivada.name,
      unidad_derivada_factor: Number(unidad_derivada?.factor),
      stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
      unidades_contenidas: Number(
        productoSeleccionadoSearchStore?.unidades_contenidas ?? 0
      ),
      unidades_derivadas_disponibles: unidades_derivadas,
    }

    setProductoAgregado(valuesFormated)
    setValues(valuesDefault)
    if (closeModal) setOpen(false)
  }

  const cantidadRef = useRef<HTMLInputElement>(null)
  const unidad_derivadaRef = useRef<RefSelectBaseProps>(null)
  const buttom_masRef = useRef<HTMLButtonElement>(null)
  const lastProductoIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (
      productoSeleccionadoSearchStore?.id &&
      productoSeleccionadoSearchStore.id !== lastProductoIdRef.current &&
      lastProductoIdRef.current !== undefined
    ) {
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
    }
  }, [unidades_derivadas])

  const unidad_derivada_seleccionada = unidades_derivadas?.find(
    (item) => item.unidad_derivada.id === values?.unidad_derivada_id
  )

  // Stock info
  const stockFraccion = Number(producto_en_almacen?.stock_fraccion ?? 0)
  const unidadesContenidas = Number(
    productoSeleccionadoSearchStore?.unidades_contenidas ?? 0
  )
  const stockActual = getStock({
    stock_fraccion: stockFraccion,
    unidades_contenidas: unidadesContenidas,
  }).stock

  const cantidadFraccion =
    Number(values.cantidad ?? 0) *
    Number(unidad_derivada_seleccionada?.factor ?? 0)
  const stockDespues = getStock({
    stock_fraccion: stockFraccion - cantidadFraccion,
    unidades_contenidas: unidadesContenidas,
  }).stock
  const sinStock = cantidadFraccion > stockFraccion

  return (
    <div className="flex flex-col gap-2">
      <LabelBase label="Cantidad:" orientation="column">
        <InputNumberBase
          ref={cantidadRef}
          placeholder="Cantidad"
          precision={3}
          prefix={<FaBoxes size={15} className="text-rose-700 mx-1" />}
          onChange={(value) => handleChange(value, 'cantidad')}
          value={values.cantidad}
          min={0.001}
          nextInEnter={false}
          controls={false}
          keyboard={false}
          onKeyUp={(e) => {
            if (e.key === 'Enter') buttom_masRef.current?.focus()
          }}
        />
        {values.cantidad && sinStock && (
          <div className="text-red-600 text-xs mt-1 font-medium">
            Stock insuficiente
          </div>
        )}
      </LabelBase>
      <LabelBase label="Unidad Derivada:" orientation="column">
        <SelectBase
          ref={unidad_derivadaRef}
          placeholder="Unidad Derivada"
          prefix={
            <FaWeightHanging size={15} className="text-rose-700 mx-1" />
          }
          onChange={(value) => handleChange(value, 'unidad_derivada_id')}
          className="w-full"
          value={values.unidad_derivada_id}
          options={
            unidades_derivadas?.map((item) => ({
              value: item.unidad_derivada.id,
              label: item.unidad_derivada.name,
            })) || []
          }
        />
      </LabelBase>

      {/* Stock info */}
      <div className="flex items-center justify-between gap-4 my-2">
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500">Stock Origen</div>
          <div className="font-bold text-yellow-600 text-xl">{stockActual}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xs text-gray-500">Después</div>
          <div
            className={`font-bold text-xl ${sinStock ? 'text-red-600' : 'text-emerald-600'}`}
          >
            {stockDespues}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <ButtonBase
          ref={buttom_masRef}
          color="success"
          className="flex items-center justify-center gap-3 !rounded-md w-full h-full text-balance px-4! hover:!scale-100"
          onClick={() => handleOk(false)}
        >
          <FaPlusCircle className="min-w-fit" size={12} /> Más
        </ButtonBase>
        <ButtonBase
          color="warning"
          className="flex items-center justify-center gap-3 !rounded-md w-full h-full text-nowrap px-4! hover:!scale-100"
          onClick={() => handleOk(true)}
        >
          <FaPlusCircle className="min-w-fit" size={12} /> Más y Salir
        </ButtonBase>
      </div>
    </div>
  )
}
