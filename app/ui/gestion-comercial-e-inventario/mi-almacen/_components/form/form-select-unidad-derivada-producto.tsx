import { useEffect, useState } from 'react'
import { FaBox, FaWeightHanging } from 'react-icons/fa6'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import SelectProductos, {
  ProductoSelect,
} from '~/app/_components/form/selects/select-productos'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import SelectTiposIngresoSalida from '~/app/_components/form/selects/select-tipos-ingreso-salida'
import LabelBase from '~/components/form/label-base'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { useStoreAlmacen } from '~/store/store-almacen'
import StockIngresoSalida from '../others/stock-ingreso-salida'
import { FormInstance } from 'antd'
import { IngresoSalidaEnum } from '~/app/_lib/tipos-ingresos-salidas'

export default function FormSelectUnidadDerivadaProducto({
  form,
  open,
  tipo,
}: {
  form: FormInstance
  open: boolean
  tipo: IngresoSalidaEnum
}) {
  const can = usePermission()
  const [producto, setProducto] = useState<ProductoSelect>()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const producto_en_almacen = producto?.producto_en_almacenes?.find(
    item => item.almacen_id === almacen_id
  )
  const unidades_derivadas = producto_en_almacen?.unidades_derivadas

  const [factor, setFactor] = useState(0)

  useEffect(() => {
    setProducto(undefined)
    setFactor(0)
  }, [open])

  return (
    <>
      <LabelBase label='Producto:' classNames={{ labelParent: 'mb-6' }}>
        <SelectProductos
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
        </LabelBase>
        <LabelBase label='Costo Actual:' orientation='column'>
          <div className='mb-9 font-bold text-nowrap text-xl'>
            S/.{' '}
            {(Number(producto_en_almacen?.costo ?? 0) * factor).toLocaleString(
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
          showButtonCreate={can(permissions.PROVEEDOR_CREATE)}
          className='w-full'
          classNameIcon='text-rose-700 mx-1'
          propsForm={{
            name: 'proveedor_id',
            rules: [
              {
                required: true,
                message: 'Por favor, selecciona un Proveedor',
              },
            ],
          }}
          form={form}
        />
      </LabelBase>

      <div className='flex gap-8'>
        <div className='flex flex-col flex-1'>
          <LabelBase label='Tipo Ingreso:' classNames={{ labelParent: 'mb-6' }}>
            <SelectTiposIngresoSalida
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
