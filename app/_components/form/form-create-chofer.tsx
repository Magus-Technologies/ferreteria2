import { FaAddressCard, FaUser } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import LabelBase from '~/components/form/label-base'
import { FormInstance } from 'antd/lib'
import InputBase from '~/app/_components/form/inputs/input-base'
import { BsGeoAltFill } from 'react-icons/bs'
import { FaMobileButton } from 'react-icons/fa6'
import { Chofer } from '~/lib/api/chofer'
import InputConsultaDni from '~/app/_components/form/inputs/input-consulta-dni'
import { ConsultaDni } from '~/app/_types/consulta-ruc'

export default function FormCreateChofer({
  form,
  dataEdit,
}: {
  form: FormInstance
  dataEdit?: Chofer
}) {
  return (
    <>
      <div className='flex items-center justify-center mt-5'>
        <LabelBase
          label='DNI:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputConsultaDni
            prefix={<FaAddressCard className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'dni',
              validateTrigger: 'onBlur',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el DNI',
                },
                {
                  len: 8,
                  message: 'El DNI debe tener 8 dígitos',
                },
              ],
            }}
            placeholder='DNI'
            automatico={dataEdit ? false : true}
            onSuccess={(res) => {
              const dniData = (res as ConsultaDni)?.dni
                ? (res as ConsultaDni)
                : undefined

              form.resetFields([
                'nombres',
                'apellidos',
                'telefono',
                'email',
                'direccion',
                'licencia',
              ])

              if (dniData) {
                form.setFieldValue('nombres', dniData.nombres)
                form.setFieldValue(
                  'apellidos',
                  `${dniData.apellidoPaterno} ${dniData.apellidoMaterno}`
                )
              }
            }}
            form={form}
            nameWatch='dni'
          />
        </LabelBase>
      </div>

      <LabelBase label='Licencia:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<FaAddressCard className='text-rose-700 mx-1' />}
          propsForm={{
            name: 'licencia',
            rules: [
              { required: true, message: 'La licencia es requerida' },
            ],
          }}
          placeholder='Licencia'
          uppercase
        />
      </LabelBase>

      <div className='flex gap-4 items-center justify-center'>
        <LabelBase label='Nombres:' className='w-full' orientation='column'>
          <InputBase
            prefix={<FaUser className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'nombres',
              rules: [
                { required: true, message: 'Los nombres son requeridos' },
              ],
            }}
            placeholder='Nombres'
            uppercase
          />
        </LabelBase>
        <LabelBase label='Apellidos:' className='w-full' orientation='column'>
          <InputBase
            prefix={<FaUser className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'apellidos',
              rules: [
                { required: true, message: 'Los apellidos son requeridos' },
              ],
            }}
            placeholder='Apellidos'
            uppercase
          />
        </LabelBase>
      </div>

      <LabelBase label='Dirección:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion',
          }}
          placeholder='Dirección'
          uppercase
        />
      </LabelBase>

      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label='Telefono:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputBase
            prefix={<FaMobileButton className='text-cyan-600 mx-1' />}
            propsForm={{
              name: 'telefono',
            }}
            placeholder='Telefono'
          />
        </LabelBase>
        <LabelBase
          label='Email:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputBase
            prefix={<MdEmail className='text-cyan-600 mx-1' />}
            propsForm={{
              name: 'email',
              rules: [
                { type: 'email', message: 'Email inválido' },
              ],
            }}
            placeholder='Email'
            uppercase={false}
          />
        </LabelBase>
      </div>
    </>
  )
}
