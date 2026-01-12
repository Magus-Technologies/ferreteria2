import { Form, FormInstance } from 'antd'
import ButtonBase from '~/components/buttons/button-base'
import TableDetalleDePreciosEdicion from '../tables/table-detalle-de-precios-edicion'

export default function FormSectionUnidadesDerivadas({
  form,
}: {
  form: FormInstance
}) {
  return (
    <div className='w-full mt-6'>
      <Form.List name='unidades_derivadas'>
        {(fields, { add, remove}) => {
          return (
            <div className='w-full' style={{ minHeight: '280px' }}>
              <TableDetalleDePreciosEdicion
                form={form}
                rowDragManaged={true}
                remove={remove}
                className='w-full'
                style={{ height: '250px' }}
                classNames={{
                  titleParent: 'flex items-center gap-2 md:gap-4 mb-2',
                }}
                extraTitle={
                  <ButtonBase
                    type='button'
                    onClick={() => {
                      // Agregar con valores iniciales por defecto
                      add({
                        unidad_derivada_id: undefined,
                        factor: 1,
                        costo: 0,
                        p_venta: 0,
                        precio_publico: 0,
                        ganancia: 0,
                        comision_publico: 0,
                        precio_especial: 0,
                        comision_especial: 0,
                        activador_especial: 0,
                        precio_minimo: 0,
                        comision_minimo: 0,
                        activador_minimo: 0,
                        precio_ultimo: 0,
                        comision_ultimo: 0,
                        activador_ultimo: 0,
                      });
                    }}
                    color='success'
                    size='sm'
                    className='whitespace-nowrap flex-shrink-0 text-xs md:text-sm'
                  >
                    + Agregar Unidad Derivada
                  </ButtonBase>
                }
                data={fields}
              />
            </div>
          )
        }}
      </Form.List>
    </div>
  )
}
