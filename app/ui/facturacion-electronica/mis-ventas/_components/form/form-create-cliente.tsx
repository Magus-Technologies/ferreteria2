import { FaAddressCard } from 'react-icons/fa'
import InputConsultaRuc from '~/app/_components/form/inputs/input-consulta-ruc'
import { ConsultaDni, ConsultaRuc } from '~/app/_types/consulta-ruc'
import LabelBase from '~/components/form/label-base'
import { MdEmail, MdFactory } from 'react-icons/md'
import { FormInstance } from 'antd/lib'
import InputBase from '~/app/_components/form/inputs/input-base'
import { BsGeoAltFill } from 'react-icons/bs'
import { FaMobileButton } from 'react-icons/fa6'
import { getClienteResponseProps } from '~/app/_actions/cliente'

export default function FormCreateCliente({
  form,
  dataEdit,
}: {
  form: FormInstance
  dataEdit?: getClienteResponseProps
}) {
  return (
    <>
      <div className='flex items-center justify-center mt-4'>
        <LabelBase
          label='Ruc / DNI:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputConsultaRuc
            prefix={<FaAddressCard className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'numero_documento',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el RUC o DNI',
                },
              ],
            }}
            placeholder='Ruc / DNI'
            automatico={dataEdit ? false : true}
            onSuccess={(res) => {
              const dniData = (res as ConsultaDni)?.dni
                ? (res as ConsultaDni)
                : undefined
              const rucData = (res as ConsultaRuc)?.ruc
                ? (res as ConsultaRuc)
                : undefined
              form.resetFields([
                'razon_social',
                'nombres',
                'apellidos',
                'direccion',
                'telefono',
                'email',
              ])

              if (dniData) {
                form.setFieldValue('nombres', dniData.nombres)
                form.setFieldValue(
                  'apellidos',
                  `${dniData.apellidoPaterno} ${dniData.apellidoMaterno}`
                )
              } else if (rucData) {
                form.setFieldValue('razon_social', rucData.razonSocial)
                form.setFieldValue('direccion', rucData.direccion)
                form.setFieldValue('telefono', rucData.telefonos[0])
              }
            }}
            form={form}
            nameWatch='numero_documento'
          />
        </LabelBase>
      </div>
      <LabelBase label='Razon Social:' orientation='column'>
        <InputBase
          prefix={<MdFactory className='text-rose-700 mx-1' />}
          propsForm={{
            name: 'razon_social',
          }}
          placeholder='Razon Social'
        />
      </LabelBase>
      <div className='flex gap-4 items-center justify-center'>
        <LabelBase label='Nombres:' className='w-full' orientation='column'>
          <InputBase
            prefix={<MdFactory className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'nombres',
            }}
            placeholder='Nombres'
          />
        </LabelBase>
        <LabelBase label='Apellidos:' className='w-full' orientation='column'>
          <InputBase
            prefix={<MdFactory className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'apellidos',
            }}
            placeholder='Apellidos'
          />
        </LabelBase>
      </div>
      <LabelBase label='Direccion:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion',
          }}
          placeholder='Direccion'
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
            }}
            placeholder='Email'
          />
        </LabelBase>
      </div>
    </>
  )
}
