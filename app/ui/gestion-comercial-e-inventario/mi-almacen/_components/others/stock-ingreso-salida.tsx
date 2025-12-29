import { Form } from 'antd'
import { FormInstance } from 'antd/lib'
import { getStock } from '~/app/_utils/get-stock'
import { TipoDocumento } from '@prisma/client'
import { getProductosResponseProps } from '~/app/_actions/producto'

export function calcularNuevoStock({
  stock_fraccion,
  cantidad,
  factor,
  tipo = TipoDocumento.Ingreso,
}: {
  stock_fraccion: number
  cantidad: number
  factor: number
  tipo?: TipoDocumento
}) {
  return (
    Number(stock_fraccion ?? 0) +
    Number(cantidad ?? 0) *
      Number(factor) *
      (tipo === TipoDocumento.Ingreso ? 1 : -1)
  )
}

export default function StockIngresoSalida({
  factor,
  producto_en_almacen,
  unidades_contenidas,
  form,
  tipo,
}: {
  factor: number
  producto_en_almacen:
    | getProductosResponseProps['producto_en_almacenes'][number]
    | undefined
  unidades_contenidas: number
  form: FormInstance
  tipo: TipoDocumento
}) {
  const cantidad = Form.useWatch('cantidad', { form })

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
            tipo === TipoDocumento.Ingreso
              ? 'text-emerald-600'
              : 'text-rose-600'
          } font-bold text-4xl text-nowrap`}
        >
          {
            getStock({
              stock_fraccion: calcularNuevoStock({
                stock_fraccion: Number(
                  producto_en_almacen?.stock_fraccion ?? 0
                ),
                cantidad,
                factor,
                tipo,
              }),
              unidades_contenidas,
            }).stock
          }
        </div>
      </div>
    </div>
  )
}
