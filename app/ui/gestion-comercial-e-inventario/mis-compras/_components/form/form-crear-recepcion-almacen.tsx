import { FormInstance } from 'antd'
import { useState } from 'react'
import { BsFillPostcardFill } from 'react-icons/bs'
import { FaAddressCard, FaIdCardAlt } from 'react-icons/fa'
import { MdFactory } from 'react-icons/md'
import { getProveedorResponseProps } from '~/app/_actions/proveedor'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputConsultaRuc from '~/app/_components/form/inputs/input-consulta-ruc'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import SelectProveedorCarros from '~/app/_components/form/selects/select-proveedor-carros'
import SelectProveedorChoferes from '~/app/_components/form/selects/select-proveedor-choferes'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import { ConsultaDni, ConsultaRuc } from '~/app/_types/consulta-ruc'
import LabelBase from '~/components/form/label-base'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'

export default function FormCrearRecepcionAlmacen({
  form,
}: {
  form: FormInstance
}) {
  const can = usePermission()
  const [proveedor, setProveedor] = useState<getProveedorResponseProps>()

  return (
    <>
      <div className='flex gap-8 mt-6'>
        <div className='flex flex-col items-center justify-center gap-2'>
          <SelectProveedores
            allowClear
            showButtonCreate={can(permissions.PROVEEDOR_CREATE)}
            className='w-[350px] max-w-[350px]'
            classNameIcon='text-cyan-600 mx-1'
            classIconSearch='mb-0!'
            classIconCreate='mb-0!'
            onChange={(_, proveedor) => {
              setProveedor(proveedor)
              form.setFieldValue('transportista_ruc', proveedor?.ruc)
              form.setFieldValue(
                'transportista_razon_social',
                proveedor?.razon_social
              )
            }}
          />
          <div className='flex gap-4'>
            <LabelBase label='Ruc Transportista:' orientation='column'>
              <InputConsultaRuc
                className='w-[165px]! max-w-[165px]! min-w-[165px]!'
                prefix={<FaAddressCard className='text-cyan-600 mx-1' />}
                propsForm={{
                  name: 'transportista_ruc',
                }}
                placeholder='Ruc'
                onSuccess={res => {
                  const rucData = (res as ConsultaRuc)?.ruc
                    ? (res as ConsultaRuc)
                    : undefined
                  form.resetFields(['transportista_razon_social'])
                  form.setFieldValue(
                    'transportista_razon_social',
                    rucData?.razonSocial
                  )
                }}
                form={form}
                nameWatch='transportista_ruc'
              />
            </LabelBase>
            <LabelBase label='Razón Social Transportista:' orientation='column'>
              <InputBase
                prefix={<MdFactory className='text-cyan-600 mx-1' />}
                propsForm={{
                  name: 'transportista_razon_social',
                }}
                placeholder='Razón Social'
              />
            </LabelBase>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center gap-2'>
          <SelectProveedorCarros
            allowClear
            className='w-[170px] max-w-[170px]'
            classNameIcon='text-cyan-600 mx-1'
            onChange={(_, carro) => {
              form.setFieldValue('transportista_placa', carro?.placa)
            }}
            proveedor={proveedor}
          />
          <div className='flex gap-4'>
            <LabelBase label='Placa Transportista:' orientation='column'>
              <InputBase
                className='w-[150px]! max-w-[150px]! min-w-[150px]!'
                prefix={<BsFillPostcardFill className='text-cyan-600 mx-1' />}
                propsForm={{
                  name: 'transportista_placa',
                }}
                placeholder='Placa'
              />
            </LabelBase>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center gap-2'>
          <SelectProveedorChoferes
            allowClear
            className='w-[470px] max-w-[470px]'
            classNameIcon='text-cyan-600 mx-1'
            onChange={(_, chofer) => {
              form.setFieldValue('transportista_name', chofer?.name)
              form.setFieldValue('transportista_licencia', chofer?.licencia)
              form.setFieldValue('transportista_dni', chofer?.dni)
            }}
            proveedor={proveedor}
          />
          <div className='flex gap-4'>
            <LabelBase label='Licencia Transportista:' orientation='column'>
              <InputBase
                className='w-[150px]! max-w-[150px]! min-w-[150px]!'
                prefix={<BsFillPostcardFill className='text-cyan-600 mx-1' />}
                propsForm={{
                  name: 'transportista_licencia',
                }}
                placeholder='Licencia'
              />
            </LabelBase>
            <LabelBase label='DNI Transportista:' orientation='column'>
              <InputConsultaRuc
                className='w-[150px]! max-w-[150px]! min-w-[150px]!'
                prefix={<FaAddressCard className='text-cyan-600 mx-1' />}
                propsForm={{
                  name: 'transportista_dni',
                }}
                placeholder='DNI'
                onSuccess={res => {
                  const dniData = (res as ConsultaDni)?.dni
                    ? (res as ConsultaDni)
                    : undefined
                  form.resetFields(['transportista_name'])
                  form.setFieldValue(
                    'transportista_name',
                    `${dniData?.nombres} ${dniData?.apellidoPaterno} ${dniData?.apellidoMaterno}`
                  )
                }}
                form={form}
                nameWatch='transportista_dni'
                automatico={false}
              />
            </LabelBase>
            <LabelBase
              label='Nombres y Apellidos Transportista:'
              orientation='column'
            >
              <InputBase
                prefix={<FaIdCardAlt className='text-cyan-600 mx-1' />}
                propsForm={{
                  name: 'transportista_name',
                }}
                placeholder='Nombres y Apellidos'
              />
            </LabelBase>
          </div>
        </div>
        <LabelBase label='Guía Remisión Transportista:' orientation='column'>
          <InputBase
            className='w-[180px]! max-w-[180px]! min-w-[180px]!'
            prefix={<FaIdCardAlt className='text-cyan-600 mx-1' />}
            propsForm={{
              name: 'transportista_guia_remision',
            }}
            placeholder='Guía de Remisión'
          />
        </LabelBase>
      </div>
      <LabelBase label='Observaciones:' orientation='column'>
        <TextareaBase
          rows={3}
          propsForm={{
            name: 'observaciones',
          }}
        />
      </LabelBase>
    </>
  )
}
