import { Form, FormInstance } from 'antd'
import TableComprar from '../tables/table-comprar'

export default function FormTableComprar({ form }: { form: FormInstance }) {
  return (
    <Form.List name='productos'>
      {(fields, { add, remove }) => (
        <TableComprar form={form} fields={fields} remove={remove} add={add} />
      )}
    </Form.List>
  )
}
