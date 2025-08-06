import { Divider } from 'antd'
import LabelBase from '~/components/form/label-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaBox, FaTruckRampBox } from 'react-icons/fa6'
import { TbAlertTriangleFilled } from 'react-icons/tb'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { FormInstance } from 'antd'
import { FormCreateProductoProps } from '../modals/modal-create-producto'
import FormLoteInicial from './form-lote-inicial'

interface FormSectionLoteProps {
  form: FormInstance<FormCreateProductoProps>
}

export default function FormSectionLote({ form }: FormSectionLoteProps) {
  return (
    <>
      <Divider className='!mt-2 !mb-8 !border-emerald-500'>
        Lote Inicial:
        <span className='ml-2 text-cyan-600'>
          <FormLoteInicial form={form} />
        </span>
      </Divider>
      <div className='grid grid-cols-2 gap-8'>
        <LabelBase label='N° Lote:' classNames={{ labelParent: 'mb-6' }}>
          <InputBase
            propsForm={{
              name: ['compra', 'lote'],
            }}
            placeholder='N° Lote'
            prefix={<FaTruckRampBox size={15} className='text-cyan-600 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Vencimiento:' classNames={{ labelParent: 'mb-6' }}>
          <DatePickerBase
            propsForm={{
              name: ['compra', 'vencimiento'],
            }}
            placeholder='Vencimiento'
            prefix={
              <TbAlertTriangleFilled size={15} className='text-cyan-600 mx-1' />
            }
          />
        </LabelBase>
      </div>
      <div className='grid grid-cols-2 gap-8'>
        <LabelBase label='Stock Entero:' classNames={{ labelParent: 'mb-6' }}>
          <InputNumberBase
            propsForm={{
              name: ['compra', 'stock_entero'],
            }}
            placeholder='Stock Entero'
            prefix={<FaBox size={15} className='text-cyan-600 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Stock Fraccion:' classNames={{ labelParent: 'mb-6' }}>
          <InputNumberBase
            propsForm={{
              name: ['compra', 'stock_fraccion'],
            }}
            placeholder='Stock Fraccion'
            prefix={<FaBox size={15} className='text-cyan-600 mx-1' />}
          />
        </LabelBase>
      </div>
    </>
  )
}
