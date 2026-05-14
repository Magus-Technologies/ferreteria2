import { Form, Radio } from 'antd'
import { FaAddressCard, FaIdCard } from 'react-icons/fa'
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
import { proveedorApi } from '~/lib/api/proveedor'

export default function FormCreateProveedor({
  form,
  dataEdit,
}: {
  form: FormInstance
  dataEdit?: Proveedor
}) {
  const tipoProveedor = Form.useWatch('tipo_proveedor', form)
  const esEmpresa = tipoProveedor !== 'persona'

  return (
    <>
      {/* Tipo de proveedor */}
      <Form.Item name="tipo_proveedor" noStyle>
        <Radio.Group
          className="mb-4 flex"
          onChange={() => {
            form.resetFields(['ruc', 'razon_social', 'direccion', 'telefono', 'email'])
          }}
        >
          <Radio.Button value="empresa" className="flex-1 text-center">
            Empresa
          </Radio.Button>
          <Radio.Button value="persona" className="flex-1 text-center">
            Persona Natural
          </Radio.Button>
        </Radio.Group>
      </Form.Item>

      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label={esEmpresa ? 'RUC:' : 'DNI (opcional):'}
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputConsultaRuc
            prefix={
              esEmpresa
                ? <FaAddressCard className='text-rose-700 mx-1' />
                : <FaIdCard className='text-rose-700 mx-1' />
            }
            propsForm={{
              name: 'ruc',
              validateTrigger: 'onBlur',
              rules: esEmpresa
                ? [
                    {
                      required: true,
                      message: 'Por favor, ingresa el RUC',
                    },
                    {
                      validator: (_, value) => {
                        if (!value || value.length === 11) return Promise.resolve()
                        return Promise.reject(new Error('El RUC debe tener 11 caracteres'))
                      },
                    },
                    {
                      validator: async (_, value) => {
                        if (!value || value.length !== 11) return Promise.resolve()
                        const response = await proveedorApi.checkDocumento(value, dataEdit?.id)
                        if (response.data?.exists) return Promise.reject(new Error('Este RUC ya existe'))
                        return Promise.resolve()
                      },
                    },
                  ]
                : [
                    {
                      validator: (_, value) => {
                        if (!value || value.length === 8) return Promise.resolve()
                        return Promise.reject(new Error('El DNI debe tener 8 dígitos'))
                      },
                    },
                    {
                      validator: async (_, value) => {
                        if (!value || value.length !== 8) return Promise.resolve()
                        const response = await proveedorApi.checkDocumento(value, dataEdit?.id)
                        if (response.data?.exists) return Promise.reject(new Error('Este DNI ya existe'))
                        return Promise.resolve()
                      },
                    },
                  ],
            }}
            placeholder={esEmpresa ? 'RUC (11 dígitos)' : 'DNI (8 dígitos)'}
            automatico={dataEdit ? false : true}
            onSuccess={res => {
              const dniData = (res as ConsultaDni)?.dni ? (res as ConsultaDni) : undefined
              const rucData = (res as ConsultaRuc)?.ruc ? (res as ConsultaRuc) : undefined
              form.resetFields(['razon_social', 'direccion', 'telefono', 'email'])
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
        label={esEmpresa ? 'Razon Social:' : 'Nombres y Apellidos:'}
        orientation='column'
      >
        <InputBase
          prefix={<MdFactory className='text-rose-700 mx-1' />}
          propsForm={{
            name: 'razon_social',
            rules: [
              {
                required: true,
                message: `Por favor, ingresa ${esEmpresa ? 'la razón social' : 'los nombres y apellidos'}`,
              },
            ],
          }}
          placeholder={esEmpresa ? 'Razon Social' : 'Nombres y Apellidos'}
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
