import { Form, FormInstance } from 'antd'
import ButtonBase from '~/components/buttons/button-base'
import TableDetalleDePreciosEdicion from '../tables/table-detalle-de-precios-edicion'

export default function FormSectionUnidadesDerivadas({
  form,
}: {
  form: FormInstance
}) {
  return (
    <Form.List name='unidades_derivadas'>
      {(fields, { add, remove }) => (
        <TableDetalleDePreciosEdicion
          form={form}
          remove={remove}
          className='h-[300px]'
          classNames={{
            titleParent: 'flex items-center gap-4 text-nowrap',
          }}
          extraTitle={
            <ButtonBase
              type='button'
              onClick={() => add()}
              color='success'
              size='sm'
            >
              + Agregar Unidad Derivada
            </ButtonBase>
          }
          data={fields}
        />
      )}
    </Form.List>
  )
}
