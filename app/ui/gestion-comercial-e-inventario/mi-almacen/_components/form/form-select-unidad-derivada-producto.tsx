import { useEffect, useState } from 'react'
import { FaBox, FaWeightHanging } from 'react-icons/fa6'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import SelectProductos from '~/app/_components/form/selects/select-productos'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import SelectTiposIngresoSalida from '~/app/_components/form/selects/select-tipos-ingreso-salida'
import LabelBase from '~/components/form/label-base'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import StockIngresoSalida from '../others/stock-ingreso-salida'
import { useStoreProductoSeleccionado } from '../../_store/store-producto-seleccionado'
import { TipoDocumento } from '~/types'
import { Form, FormInstance } from 'antd'
import { useStoreAlmacen } from '~/store/store-almacen'
import type { Producto } from '~/app/_types/producto'
import { GetStock } from '~/app/_utils/get-stock'

export default function FormSelectUnidadDerivadaProducto({
  form,
  open,
  tipo,
}: {
  form: FormInstance
  open: boolean
  tipo: TipoDocumento
}) {
  const { can } = usePermissionHook()

  const productoSeleccionado = useStoreProductoSeleccionado(
    store => store.producto
  )
  const [producto, setProducto] = useState<
    Producto | undefined
  >(productoSeleccionado)

  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const producto_en_almacen = producto?.producto_en_almacenes.find(
    item => item.almacen_id === almacen_id
  )
  const unidades_derivadas = producto_en_almacen?.unidades_derivadas

  // Costo según PEPS: si todavía queda stock del lote ANTERIOR, ese es el costo que
  // sale primero (costo_anterior); cuando ya no queda, se usa el costo ACTUAL.
  // Ambos buckets ya incluyen el flete del lote. Cae al promedio si no hay buckets.
  const pa = producto_en_almacen as any
  const costoPeps =
    Number(pa?.stock_costo_anterior ?? 0) > 0
      ? Number(pa?.costo_anterior ?? pa?.costo ?? 0)
      : Number(pa?.costo_actual ?? pa?.costo ?? 0)

  const [factor, setFactor] = useState(0)
  const cantidadWatched = Form.useWatch('cantidad', form)

  useEffect(() => {
    form.setFieldValue(
      'unidad_derivada_id',
      unidades_derivadas?.[0]?.unidad_derivada?.id
    )
    setFactor(Number(unidades_derivadas?.[0]?.factor ?? 0))
  }, [form, unidades_derivadas])

  useEffect(() => {
    setProducto(productoSeleccionado)
    form.setFieldValue('producto_id', productoSeleccionado?.id)
  }, [form, productoSeleccionado])

  useEffect(() => {
    if (!open) {
      setProducto(undefined)
      setFactor(0)
    }
  }, [open])

  return (
    <>
      <LabelBase label='Producto:' classNames={{ labelParent: 'mb-6' }}>
        <SelectProductos
          optionsDefault={
            productoSeleccionado
              ? [
                  {
                    value: productoSeleccionado.id,
                    label: `${productoSeleccionado.cod_producto} : ${productoSeleccionado.name}`,
                  },
                ]
              : []
          }
          className='w-full'
          classNameIcon='text-rose-700 mx-1'
          onChange={(_, product) => setProducto(product)}
          propsForm={{
            name: 'producto_id',
            rules: [
              {
                required: true,
                message: 'Por favor, selecciona un Producto',
              },
            ],
          }}
          withSearch
          showButtonCreate={can(permissions.PRODUCTO_CREATE)}
          form={form}
          limpiarOnChange
        />
      </LabelBase>
      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label='Unidad Derivada:'
          className='w-full'
          orientation='column'
        >
          <SelectBase
            prefix={
              <FaWeightHanging className='text-rose-700 mx-1' size={14} />
            }
            variant='filled'
            placeholder='Unidad Derivada'
            options={unidades_derivadas?.map(item => ({
              value: item.unidad_derivada.id,
              label: item.unidad_derivada.name,
            }))}
            onChange={val => {
              const unidad_derivada = unidades_derivadas?.find(
                item => item.unidad_derivada.id === val
              )
              setFactor(Number(unidad_derivada?.factor ?? 0))
            }}
            propsForm={{
              name: 'unidad_derivada_id',
              rules: [
                {
                  required: true,
                  message: 'Por favor, selecciona una Unidad Derivada',
                },
              ],
            }}
          />
        </LabelBase>
        <LabelBase label='Cantidad:' className='w-full' orientation='column'>
          <InputNumberBase
            propsForm={{
              name: 'cantidad',
            }}
            placeholder='Cantidad'
            precision={3}
            min={0.001}
            prefix={<FaBox size={15} className='text-rose-600 mx-1' />}
          />
          {factor > 0 && producto_en_almacen && (() => {
            const stockDisponible = Number(producto_en_almacen.stock_fraccion)
            const cantidadEnFraccion = Number(cantidadWatched ?? 0) * factor
            const excede = !!cantidadWatched && cantidadEnFraccion > stockDisponible
            return (
              <div className={`text-xs mt-1 font-medium flex items-center gap-1 ${excede ? 'text-red-600' : 'text-gray-400'}`}>
                {excede ? '⚠️' : ''} Stock:{' '}
                <GetStock stock_fraccion={stockDisponible} unidades_contenidas={factor} />
              </div>
            )
          })()}
        </LabelBase>
        <LabelBase label='Costo Actual:' orientation='column'>
          <div className='mb-9 font-bold text-nowrap text-xl'>
            S/.{' '}
            {(costoPeps * factor).toLocaleString(
              'en-US',
              {
                maximumFractionDigits: 4,
              }
            )}
          </div>
        </LabelBase>
      </div>

      <LabelBase label='Proveedor:' classNames={{ labelParent: 'mb-6' }}>
        <SelectProveedores
          allowClear
          showButtonCreate={can(permissions.PROVEEDOR_CREATE)}
          className='w-full max-w-[420px]'
          classNameIcon='text-cyan-600 mx-1'
          propsForm={{
            name: 'proveedor_id',
          }}
          form={form}
        />
      </LabelBase>

      <div className='flex gap-8'>
        <div className='flex flex-col flex-1'>
          <LabelBase
            label={`Tipo de ${tipo}:`}
            classNames={{ labelParent: 'mb-6' }}
          >
            <SelectTiposIngresoSalida
              showButtonCreate={can(permissions.TIPO_INGRESO_SALIDA_CREATE)}
              className='w-full'
              classNameIcon='text-rose-700 mx-1'
              propsForm={{
                name: 'tipo_ingreso_id',
                rules: [
                  {
                    required: true,
                    message: 'Por favor, selecciona un Tipo Ingreso',
                  },
                ],
              }}
              form={form}
            />
          </LabelBase>
          <LabelBase label='Observaciones:' orientation='column'>
            <TextareaBase
              propsForm={{
                name: 'descripcion',
              }}
            />
          </LabelBase>
        </div>
        <StockIngresoSalida
          tipo={tipo}
          factor={factor}
          producto_en_almacen={producto_en_almacen}
          unidades_contenidas={Number(producto?.unidades_contenidas ?? 0)}
          form={form}
        />
      </div>
    </>
  )
}
