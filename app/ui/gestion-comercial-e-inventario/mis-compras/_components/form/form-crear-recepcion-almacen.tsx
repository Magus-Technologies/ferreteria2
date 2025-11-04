import { FormInstance } from 'antd'
import { BsFillPostcardFill } from 'react-icons/bs'
import { FaAddressCard, FaIdCardAlt } from 'react-icons/fa'
import { MdFactory } from 'react-icons/md'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputConsultaRuc from '~/app/_components/form/inputs/input-consulta-ruc'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import { ConsultaDni, ConsultaRuc } from '~/app/_types/consulta-ruc'
import LabelBase from '~/components/form/label-base'

export default function FormCrearRecepcionAlmacen({
  form,
}: {
  form: FormInstance
}) {
  return (
    <>
      <div className='flex gap-4 mt-4'>
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
