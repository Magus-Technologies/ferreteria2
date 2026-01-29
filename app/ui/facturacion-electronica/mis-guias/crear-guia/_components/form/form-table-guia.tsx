import { Form, FormInstance } from 'antd'
import TableGuia from '~/app/ui/facturacion-electronica/mis-guias/crear-guia/_components/tables/table-guia'

export default function FormTableGuia({
  form,
  guia,
}: {
  form: FormInstance
  guia?: any
}) {
  return (
    <div className='h-[300px] md:h-[400px] lg:h-[500px]'>
      <Form.List name='productos'>
        {(fields, { add, remove }) => (
          <TableGuia
            guia={guia}
            form={form}
            fields={fields}
            remove={remove}
            add={add}
          />
        )}
      </Form.List>
    </div>
  )
}
