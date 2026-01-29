import { Form, FormInstance } from 'antd'
import { FormCreateProductoProps } from '../_components/modals/modal-create-producto'

interface UseChangeStockInicialProps {
  form: FormInstance<FormCreateProductoProps>
  onChangeValues?: () => void
}

export default function useChangeStockInicial({
  form,
}: UseChangeStockInicialProps) {
  const stock_entero = Form.useWatch(['compra', 'stock_entero'], form) || 0
  const stock_fraccion = Form.useWatch(['compra', 'stock_fraccion'], form) || 0
  const unidades_contenidas = Form.useWatch(['unidades_contenidas'], form) || 1

  return { stock_entero, stock_fraccion, unidades_contenidas }
}
