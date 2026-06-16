/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react'
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
import SelectBase, {
  RefSelectBaseProps,
} from '~/app/_components/form/selects/select-base'
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
import ModalEditarPreciosProducto from '~/app/_components/modals/modal-editar-precios-producto'
import {
  DetalleDePreciosProps,
  getCostoActualBase,
} from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/tables/columns-detalle-de-precios'

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
  onChangeValues,
  autoFillPrecioCompraWithCosto = false,
  showStockMaxWarning = false,
}: {
  onOk?: (values: ValuesCardAgregarProductoCompra) => void
  setOpen: (open: boolean) => void
  onChangeValues?: (values: ValuesCardAgregarProductoCompra) => void
  autoFillPrecioCompraWithCosto?: boolean
  showStockMaxWarning?: boolean
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
      producto_codigo: productoSeleccionadoSearchStore?.cod_producto,
      marca_name: productoSeleccionadoSearchStore?.marca?.name,
      unidad_derivada_name: unidad_derivada?.unidad_derivada.name,
      unidad_derivada_factor: Number(unidad_derivada?.factor),
      precio_compra: values.bonificacion ? 0 : values.precio_compra,
      costo_actual: Number(producto_en_almacen?.costo ?? 0),
      stock_max: productoSeleccionadoSearchStore?.stock_max,
      unidades_contenidas: Number(productoSeleccionadoSearchStore?.unidades_contenidas ?? 1),
      stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
      unidades_derivadas_disponibles: unidades_derivadas,
    }

    onOk?.(valuesFormated)
    setValues(valuesDefault)
    setProductoAgregadoCompra(valuesFormated)
    if (closeModal) setOpen(false)
  }

  const cantidadRef = useRef<HTMLInputElement>(null)
  const unidad_derivadaRef = useRef<RefSelectBaseProps>(null)
  const precio_compraRef = useRef<HTMLInputElement>(null)
  const buttom_masRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    cantidadRef.current?.focus()
  }, [productoSeleccionadoSearchStore])
  useEffect(() => {
    unidad_derivadaRef.current?.changeValue(
      unidades_derivadas?.[0].unidad_derivada.id
    )
    handleChange(
      unidades_derivadas?.[0].unidad_derivada.id || null,
      'unidad_derivada_id'
    )
  }, [unidades_derivadas])

  const unidad_derivada_seleccionada = unidades_derivadas?.find(
    item => item.unidad_derivada.id === values?.unidad_derivada_id
  )

  useEffect(() => {
    // Autocompletar el costo al seleccionar el producto / unidad derivada.
    if (autoFillPrecioCompraWithCosto && unidad_derivada_seleccionada && producto_en_almacen) {
      // Se autocompleta con el "Costo Actual" del detalle de precios (capa PEPS
      // vigente). Se usa el MISMO cálculo que la columna "Costo Actual" para que
      // el Precio Compra coincida exactamente con lo que ve el usuario en esa tabla.
      const costoActualBase = getCostoActualBase(producto_en_almacen as any)
      // Fallback: si no se pudo resolver el costo actual, usar el costo del almacén
      // para que el precio SIEMPRE se autocomplete al elegir el producto.
      const costoBase = costoActualBase > 0 ? costoActualBase : Number(producto_en_almacen?.costo ?? 0)
      const costo = Number(unidad_derivada_seleccionada.factor ?? 0) * costoBase
      if (costo > 0) {
        handleChange(costo, 'precio_compra')
      }
    }
  }, [autoFillPrecioCompraWithCosto, unidad_derivada_seleccionada, producto_en_almacen])

  useEffect(() => {
    onChangeValues?.(values)
  }, [values])

  const costoActualEnUnidad = Number(unidad_derivada_seleccionada?.factor ?? 0) * getCostoActualBase(producto_en_almacen as any)
  const mostrarBotonPrecios = !values.bonificacion && costoActualEnUnidad > 0 && Number(values.precio_compra ?? 0) > 0 && Number(values.precio_compra ?? 0) !== costoActualEnUnidad

  const [openModalPrecios, setOpenModalPrecios] = useState(false)

  // Construir el objeto DetalleDePreciosProps para el modal existente
  const detallePrecio: DetalleDePreciosProps | null =
    unidad_derivada_seleccionada && productoSeleccionadoSearchStore && producto_en_almacen
      ? ({
          unidad_derivada_id: unidad_derivada_seleccionada.unidad_derivada.id,
          factor: unidad_derivada_seleccionada.factor,
          precio_publico: unidad_derivada_seleccionada.precio_publico,
          comision_publico: (unidad_derivada_seleccionada as any).comision_publico ?? 0,
          precio_especial: (unidad_derivada_seleccionada as any).precio_especial ?? 0,
          comision_especial: (unidad_derivada_seleccionada as any).comision_especial ?? 0,
          activador_especial: (unidad_derivada_seleccionada as any).activador_especial ?? 0,
          precio_minimo: (unidad_derivada_seleccionada as any).precio_minimo ?? 0,
          comision_minimo: (unidad_derivada_seleccionada as any).comision_minimo ?? 0,
          activador_minimo: (unidad_derivada_seleccionada as any).activador_minimo ?? 0,
          precio_ultimo: (unidad_derivada_seleccionada as any).precio_ultimo ?? 0,
          comision_ultimo: (unidad_derivada_seleccionada as any).comision_ultimo ?? 0,
          activador_ultimo: (unidad_derivada_seleccionada as any).activador_ultimo ?? 0,
          unidad_derivada: unidad_derivada_seleccionada.unidad_derivada as any,
          producto: productoSeleccionadoSearchStore as any,
          producto_almacen: {
            costo: producto_en_almacen.costo as any,
            stock_fraccion: producto_en_almacen.stock_fraccion as any,
            ubicacion: null as any,
          },
          almacen: { id: almacen_id!, name: '' },
        } as DetalleDePreciosProps)
      : null

  // Calcular si se excede el stock máximo.
  // stock_max está configurado en unidades enteras; el stock y las cantidades se manejan
  // en fracción, así que convertimos el máximo a fracción (× unidades_contenidas) para comparar.
  const stockMax = productoSeleccionadoSearchStore?.stock_max
  const unidadesContenidas = Number(productoSeleccionadoSearchStore?.unidades_contenidas ?? 1) || 1
  const stockMaxFraccion = Number(stockMax) * unidadesContenidas
  const stockActualFraccion = Number(producto_en_almacen?.stock_fraccion ?? 0)
  const cantidadAgregada = Number(values.cantidad ?? 0) * Number(unidad_derivada_seleccionada?.factor ?? 1)
  const excedeStockMax = showStockMaxWarning && !!stockMax && (stockActualFraccion + cantidadAgregada) > stockMaxFraccion

  return (
    <div className='flex flex-col gap-2'>
      <LabelBase label='Cantidad:' orientation='column'>
        <InputNumberBase
          ref={cantidadRef}
          placeholder='Cantidad'
          precision={2}
          prefix={<FaBoxes size={15} className='text-rose-700 mx-1' />}
          onChange={value => handleChange(value, 'cantidad')}
          value={values.cantidad}
          min={0}
          nextInEnter={false}
          onKeyUp={e => {
            if (e.key === 'Enter') precio_compraRef.current?.focus()
          }}
        />
        {unidad_derivada_seleccionada && producto_en_almacen && (() => {
          const stockDisponible = Number(producto_en_almacen.stock_fraccion)
          const cantidadEnFraccion = Number(values.cantidad ?? 0) * Number(unidad_derivada_seleccionada.factor)
          const excede = !!values.cantidad && cantidadEnFraccion > stockDisponible
          return (
            <div className={`text-xs mt-1 font-medium flex items-center gap-1 ${excede ? 'text-red-600' : 'text-gray-400'}`}>
              {excede ? '⚠️' : ''} Stock:{' '}
              <GetStock stock_fraccion={stockDisponible} unidades_contenidas={Number(unidad_derivada_seleccionada.factor)} />
            </div>
          )
        })()}
        {excedeStockMax && (
          <div className='text-red-600 text-[11px] mt-1 font-medium leading-tight text-center'>
            ⚠️ Stock Máx: {Math.round(stockMax)}
          </div>
        )}
      </LabelBase>
      <LabelBase label='Unidad Derivada:' orientation='column'>
        <SelectBase
          ref={unidad_derivadaRef}
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
      <div className='grid grid-cols-2 font-bold text-sm'>
        <div className='flex flex-col items-center'>
          <div className='text-slate-500'>Costo:</div>
          <div className='text-orange-700'>
            S/.{' '}
            {(
              Number(unidad_derivada_seleccionada?.factor ?? 0) *
              // Costo ACTUAL: el MISMO valor que muestra la columna "Costo Actual"
              // del detalle de precios (capa PEPS vigente = última compra recibida).
              getCostoActualBase(producto_en_almacen as any)
            ).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </div>
        </div>
        <div className='flex flex-col items-center'>
          <div className='text-slate-500'>Precio Público:</div>
          <div className='text-orange-700'>
            S/.{' '}
            {Number(
              unidad_derivada_seleccionada?.precio_publico ?? 0
            ).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            })}
          </div>
        </div>
      </div>
      <LabelBase label='Precio Compra:' orientation='column'>
        <InputNumberBase
          ref={precio_compraRef}
          placeholder='Precio Compra'
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
          nextInEnter={false}
          onKeyUp={e => {
            if (e.key === 'Enter') buttom_masRef.current?.focus()
          }}
        />
      </LabelBase>
      {mostrarBotonPrecios && (
        <button
          type='button'
          onClick={() => setOpenModalPrecios(true)}
          className='flex items-center gap-2 w-full px-3 py-2 rounded border border-amber-300 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors'
        >
          <TbAlertTriangleFilled size={15} />
          El costo cambió — actualizar precios de venta
        </button>
      )}

      <ModalEditarPreciosProducto
        open={openModalPrecios}
        setOpen={setOpenModalPrecios}
        detallePrecio={detallePrecio}
        almacen_id={almacen_id ?? 0}
      />

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
