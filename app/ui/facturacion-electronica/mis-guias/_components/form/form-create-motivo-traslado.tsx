import { FormInstance } from 'antd/lib'
import InputBase from '~/app/_components/form/inputs/input-base'
import LabelBase from '~/components/form/label-base'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import { FaTruckFast } from 'react-icons/fa6'
import { MdDescription } from 'react-icons/md'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'

export default function FormCreateMotivoTraslado({
  form,
  dataEdit,
}: {
  form: FormInstance
  dataEdit?: MotivoTraslado
}) {
  return (
    <>
      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label='Código:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputBase
            prefix={<FaTruckFast className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'codigo',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el código',
                },
                {
                  max: 10,
                  message: 'Máximo 10 caracteres',
                },
              ],
            }}
            placeholder='Ej: 01'
            maxLength={10}
          />
        </LabelBase>
        <LabelBase
          label='Estado:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <SelectEstado
            classNameIcon='text-rose-700 mx-1'
            propsForm={{
              name: 'activo',
              rules: [
                {
                  required: true,
                  message: 'Por favor, selecciona un estado',
                },
              ],
            }}
          />
        </LabelBase>
      </div>
      <LabelBase label='Descripción:' orientation='column'>
        <InputBase
          prefix={<MdDescription className='text-rose-700 mx-1' />}
          propsForm={{
            name: 'descripcion',
            rules: [
              {
                required: true,
                message: 'Por favor, ingresa la descripción',
              },
              {
                max: 255,
                message: 'Máximo 255 caracteres',
              },
            ],
          }}
          placeholder='Ej: Venta'
          maxLength={255}
        />
      </LabelBase>
    </>
  )
}
