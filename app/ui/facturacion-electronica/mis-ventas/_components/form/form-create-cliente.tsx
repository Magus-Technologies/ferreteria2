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
import SelectTipoCliente from '~/app/_components/form/selects/select-tipo-cliente'
import { Form } from 'antd'
import { useEffect } from 'react'
import { TipoCliente, clienteApi } from '~/lib/api/cliente'

export default function FormCreateCliente({
  form,
  dataEdit,
}: {
  form: FormInstance
  dataEdit?: getClienteResponseProps
}) {
  const numero_documento = Form.useWatch('numero_documento', form)

  useEffect(() => {
    if (numero_documento?.length === 8) {
      form.setFieldValue('tipo_cliente', TipoCliente.PERSONA)
    } else if (numero_documento?.length === 11) {
      form.setFieldValue('tipo_cliente', TipoCliente.EMPRESA)
    }
  }, [numero_documento, form])

  return (
    <>
      <SelectTipoCliente
        propsForm={{
          name: 'tipo_cliente',
          className: 'hidden',
        }}
      />
      <div className='flex items-center justify-center mt-5'>
        <LabelBase
          label='Ruc / DNI:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputConsultaRuc
            prefix={<FaAddressCard className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'numero_documento',
              validateTrigger: 'onBlur',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el RUC o DNI',
                },
                {
                  validator: (_, value) => {
                    if (!value || value.length === 8 || value.length === 11) {
                      return Promise.resolve()
                    }
                    return Promise.reject(
                      new Error('El documento debe tener 8 o 11 caracteres')
                    )
                  },
                },
                {
                  validator: async (_, value) => {
                    if (!value || (value.length !== 8 && value.length !== 11)) {
                      return Promise.resolve()
                    }

                    // Verificar si el documento ya existe
                    const response = await clienteApi.checkDocumento(
                      value,
                      dataEdit?.id // Excluir el ID actual si estamos editando
                    )

                    if (response.data?.exists) {
                      return Promise.reject(
                        new Error('Este documento ya está registrado')
                      )
                    }

                    return Promise.resolve()
                  },
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
                'direccion_2',
                'direccion_3',
                'direccion_4',
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
      <LabelBase label='Dirección 1:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion',
          }}
          placeholder='Dirección 1'
          autoComplete='new-password'
        />
      </LabelBase>
      <LabelBase label='Dirección 2:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion_2',
          }}
          placeholder='Dirección 2 (opcional)'
          autoComplete='new-password'
        />
      </LabelBase>
      <LabelBase label='Dirección 3:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion_3',
          }}
          placeholder='Dirección 3 (opcional)'
          autoComplete='new-password'
        />
      </LabelBase>
      <LabelBase label='Dirección 4:' classNames={{ labelParent: 'mb-6' }}>
        <InputBase
          prefix={<BsGeoAltFill className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'direccion_4',
          }}
          placeholder='Dirección 4 (opcional)'
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
