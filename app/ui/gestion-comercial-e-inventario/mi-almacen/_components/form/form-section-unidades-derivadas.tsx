import { App, Form, FormInstance } from 'antd'
import ButtonBase from '~/components/buttons/button-base'
import TableDetalleDePreciosEdicion from '../tables/table-detalle-de-precios-edicion'

export default function FormSectionUnidadesDerivadas({
  form,
}: {
  form: FormInstance
}) {
  const { notification } = App.useApp()
  return (
    <Form.List
      name='unidades_derivadas'
      rules={[
        {
          validator: async (_, value) => {
            if (!value || value.length < 1) {
              notification.error({
                message: 'Error',
                description: 'Debe agregar al menos una unidad derivada',
              })
              return Promise.reject(
                new Error('Debe agregar al menos una unidad derivada')
              )
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }) => (
        <TableDetalleDePreciosEdicion
          form={form}
          rowDragManaged={true}
          remove={remove}
          className='h-[200px]'
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
