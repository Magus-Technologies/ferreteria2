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
      {(fields, { add, remove}) => (
        <TableDetalleDePreciosEdicion
          form={form}
          rowDragManaged={true}
          remove={remove}
          className='h-[200px]'
          classNames={{
            titleParent: 'flex items-center gap-2 md:gap-4',
          }}
          extraTitle={
            <ButtonBase
              type='button'
              onClick={() => add()}
              color='success'
              size='sm'
              className='whitespace-nowrap flex-shrink-0 text-xs md:text-sm'
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
