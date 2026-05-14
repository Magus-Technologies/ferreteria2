import { Form } from 'antd'
import { useEffect } from 'react'
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
  const rucValue: string = Form.useWatch('ruc', form) ?? ''

  // Detectar tipo automáticamente según longitud
  const tipoDetectado: 'empresa' | 'persona' | null =
    rucValue.length === 11 ? 'empresa' :
    rucValue.length === 8  ? 'persona' :
    null

  const esEmpresa = tipoDetectado !== 'persona'

  // Sincronizar tipo_proveedor con el documento ingresado
  useEffect(() => {
    if (tipoDetectado) {
      form.setFieldValue('tipo_proveedor', tipoDetectado)
    }
  }, [tipoDetectado, form])

  const labelDoc =
    tipoDetectado === 'empresa' ? 'RUC:' :
    tipoDetectado === 'persona' ? 'DNI (opcional):' :
    'RUC / DNI:'

  const placeholderDoc =
    tipoDetectado === 'empresa' ? 'RUC (11 dígitos)' :
    tipoDetectado === 'persona' ? 'DNI (8 dígitos)' :
    'RUC (11) o DNI (8 dígitos)'

  return (
    <>
      {/* tipo_proveedor se actualiza automáticamente — campo oculto */}
      <Form.Item name="tipo_proveedor" hidden noStyle>
        <input type="hidden" />
      </Form.Item>

      <div className='flex gap-4 items-center justify-center'>
        <LabelBase
          label={labelDoc}
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
              rules: [
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve()
                    if (value.length === 8 || value.length === 11) return Promise.resolve()
                    return Promise.reject(new Error('Debe ser RUC (11 dígitos) o DNI (8 dígitos)'))
                  },
                },
                {
                  validator: async (_, value) => {
                    if (!value || (value.length !== 8 && value.length !== 11)) return Promise.resolve()
                    const response = await proveedorApi.checkDocumento(value, dataEdit?.id)
                    if (response.data?.exists)
                      return Promise.reject(new Error(value.length === 11 ? 'Este RUC ya existe' : 'Este DNI ya existe'))
                    return Promise.resolve()
                  },
                },
              ],
            }}
            placeholder={placeholderDoc}
            automatico={!dataEdit}
            onSuccess={res => {
              const dniData = (res as ConsultaDni)?.dni ? (res as ConsultaDni) : undefined
              const rucData = (res as ConsultaRuc)?.ruc ? (res as ConsultaRuc) : undefined
              form.resetFields(['razon_social', 'direccion', 'telefono', 'email'])
              form.setFieldValue(
                'razon_social',
                dniData
                  ? `${dniData.nombres} ${dniData.apellidoPaterno} ${dniData.apellidoMaterno}`
                  : rucData?.razonSocial
              )
              if (rucData) {
                form.setFieldValue('direccion', rucData.direccion)
                form.setFieldValue('telefono', rucData.telefonos[0])
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
              rules: [{ required: true, message: 'Por favor, selecciona un estado' }],
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
          propsForm={{ name: 'direccion' }}
          placeholder='Direccion'
          autoComplete='new-password'
        />
      </LabelBase>

      <div className='flex gap-4 items-center justify-center'>
        <LabelBase label='Telefono:' className='w-full' classNames={{ labelParent: 'mb-6' }}>
          <InputBase
            prefix={<FaMobileButton className='text-cyan-600 mx-1' />}
            propsForm={{ name: 'telefono' }}
            placeholder='Telefono'
            autoComplete='new-password'
          />
        </LabelBase>
        <LabelBase label='Email:' className='w-full' classNames={{ labelParent: 'mb-6' }}>
          <InputBase
            prefix={<MdEmail className='text-cyan-600 mx-1' />}
            propsForm={{ name: 'email' }}
            placeholder='Email'
            autoComplete='new-password'
          />
        </LabelBase>
      </div>
    </>
  )
}
