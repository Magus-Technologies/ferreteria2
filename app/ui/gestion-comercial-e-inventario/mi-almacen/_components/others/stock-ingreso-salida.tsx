import { Form } from 'antd'
import { FormInstance } from 'antd/lib'
import { ProductoSelect } from '~/app/_components/form/selects/select-productos'
import { IngresoSalidaEnum } from '~/app/_lib/tipos-ingresos-salidas'
import { getStock } from '~/app/_utils/get-stock'

export default function StockIngresoSalida({
  factor,
  producto_en_almacen,
  unidades_contenidas,
  form,
  tipo,
}: {
  factor: number
  producto_en_almacen:
    | ProductoSelect['producto_en_almacenes'][number]
    | undefined
  unidades_contenidas: number
  form: FormInstance
  tipo: IngresoSalidaEnum
}) {
  const cantidad = Form.useWatch('cantidad', form)

  return (
    <div className='flex flex-col items-center justify-center gap-4 mb-7'>
      <div className='flex flex-col items-center justify-center'>
        <div className='font-bold text-xl'>Stock Actual</div>
        <div className='font-bold text-yellow-600 text-4xl text-nowrap'>
          {
            getStock({
              stock_fraccion: Number(producto_en_almacen?.stock_fraccion ?? 0),
              unidades_contenidas,
            }).stock
          }
        </div>
      </div>
      <div className='flex flex-col items-center justify-center'>
        <div className='font-bold text-xl'>Nuevo Stock</div>
        <div
          className={`${
            tipo === IngresoSalidaEnum.ingreso
              ? 'text-emerald-600'
              : 'text-rose-600'
          } font-bold text-4xl text-nowrap`}
        >
          {
            getStock({
              stock_fraccion:
                Number(producto_en_almacen?.stock_fraccion ?? 0) +
                Number(cantidad ?? 0) *
                  Number(factor) *
                  (tipo === IngresoSalidaEnum.ingreso ? 1 : -1),
              unidades_contenidas,
            }).stock
          }
        </div>
      </div>
    </div>
  )
}
