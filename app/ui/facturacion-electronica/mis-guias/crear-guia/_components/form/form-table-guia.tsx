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
    <div className='h-[250px] md:h-[350px] lg:h-[400px]'>
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
