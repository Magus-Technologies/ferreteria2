import { FaAddressCard } from 'react-icons/fa'
import InputConsultaRuc from '~/app/_components/form/inputs/input-consulta-ruc'
import { ConsultaDni, ConsultaRuc } from '~/app/_types/consulta-ruc'
import LabelBase from '~/components/form/label-base'
import SelectEstado from '~/app/_components/form/selects/select-estado'
import { MdEmail, MdFactory } from 'react-icons/md'
import { FormInstance } from 'antd/lib'
import InputBase from '~/app/_components/form/inputs/input-base'
import { BsGeoAltFill } from 'react-icons/bs'
import { FaMobileButton } from 'react-icons/fa6'
import type { Proveedor } from '~/lib/api/proveedor'

export default function FormCreateProveedor({
  form,
  dataEdit,
}: {
  form: FormInstance
  dataEdit?: Proveedor
}) {
  return (
    <>
      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label='Ruc:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputConsultaRuc
            prefix={<FaAddressCard className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'ruc',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el RUC',
                },
              ],
            }}
            placeholder='Ruc'
            automatico={dataEdit ? false : true}
            onSuccess={res => {
              const dniData = (res as ConsultaDni)?.dni
                ? (res as ConsultaDni)
                : undefined
              const rucData = (res as ConsultaRuc)?.ruc
                ? (res as ConsultaRuc)
                : undefined
              form.resetFields([
                'razon_social',
                'direccion',
                'telefono',
                'email',
              ])
              form.setFieldValue(
                'razon_social',
                dniData
                  ? `${dniData?.nombres} ${dniData?.apellidoPaterno} ${dniData?.apellidoMaterno}`
                  : rucData?.razonSocial
              )

              if (rucData) {
                form.setFieldValue('direccion', rucData?.direccion)
                form.setFieldValue('telefono', rucData?.telefonos[0])
              }
            }}
            form={form}
            nameWatch='ruc'
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
              name: 'estado',
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
      <LabelBase
        label='Razon Social / Nombres y Apellidos:'
        orientation='column'
      >
        <InputBase
          prefix={<MdFactory className='text-rose-700 mx-1' />}
          propsForm={{
            name: 'razon_social',
            rules: [
              {
                required: true,
                message: 'Por favor, ingresa la razón social',
              },
            ],
          }}
          placeholder='Razon Social / Nombres y Apellidos'
          autoComplete='new-password'
        />
      </LabelBase>
      <LabelBase label='Direccion:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion',
          }}
          placeholder='Direccion'
          autoComplete='new-password'
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
            autoComplete='new-password'
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
            autoComplete='new-password'
          />
        </LabelBase>
      </div>
    </>
  )
}
