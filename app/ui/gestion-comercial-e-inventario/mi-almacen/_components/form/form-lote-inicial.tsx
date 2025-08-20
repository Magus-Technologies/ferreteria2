import { FormInstance } from 'antd'
import useChangeStockInicial from '../../_hooks/use-change-stock-inicial'
import { FormCreateProductoProps } from '../modals/modal-create-producto'
import { GetStock } from '~/app/_utils/get-stock'

export default function FormLoteInicial({
  form,
}: {
  form: FormInstance<FormCreateProductoProps>
}) {
  const { stock_entero, stock_fraccion, unidades_contenidas } =
    useChangeStockInicial({ form })
  return (
    <GetStock
      stock_entero={stock_entero}
      stock_fraccion={stock_fraccion}
      unidades_contenidas={Number(unidades_contenidas)}
    />
  )
}
