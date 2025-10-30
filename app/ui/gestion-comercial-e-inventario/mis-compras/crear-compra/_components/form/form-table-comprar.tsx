import { Form, FormInstance } from 'antd'
import TableComprar from '../tables/table-comprar'

export default function FormTableComprar({
  form,
  incluye_precios = true,
  cantidad_pendiente = false,
}: {
  form: FormInstance
  incluye_precios?: boolean
  cantidad_pendiente?: boolean
}) {
  return (
    <Form.List name='productos'>
      {(fields, { add, remove }) => (
        <TableComprar
          form={form}
          fields={fields}
          remove={remove}
          add={add}
          incluye_precios={incluye_precios}
          cantidad_pendiente={cantidad_pendiente}
        />
      )}
    </Form.List>
  )
}
