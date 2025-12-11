import { FormaDePago } from '@prisma/client'
import { Form } from 'antd'
import { FormInstance } from 'antd/lib'
import { FaCalendar } from 'react-icons/fa'
import { IoIosDocument } from 'react-icons/io'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectFormaDePago from '~/app/_components/form/selects/select-forma-de-pago'
import LabelBase from '~/components/form/label-base'
import dayjs from 'dayjs'
import FormMetodoPagoCompra from './form-metodo-pago-compra'

export default function FormFormaDePagoCompra({
  form,
}: {
  form: FormInstance
}) {
  const formaDePago = Form.useWatch('forma_de_pago', form)

  return (
    <>
      <LabelBase label='Forma de Pago:' classNames={{ labelParent: 'mb-6' }}>
        <SelectFormaDePago
          classNameIcon='text-rose-700 mx-1'
          className='!w-[135px] !min-w-[135px] !max-w-[135px]'
          propsForm={{
            name: 'forma_de_pago',
            rules: [
              {
                required: true,
                message: 'Por favor, selecciona la forma de pago',
              },
            ],
          }}
        />
      </LabelBase>
      <LabelBase label='N° Días:' classNames={{ labelParent: 'mb-6' }}>
        <InputNumberBase
          prefix={
            <IoIosDocument
              className={`${
                formaDePago === FormaDePago.cr
                  ? 'text-rose-700'
                  : 'text-cyan-600'
              } mr-1`}
              size={20}
            />
          }
          className='!w-[90px] !min-w-[90px] !max-w-[90px]'
          placeholder='N° Días'
          propsForm={{
            name: 'numero_dias',
            rules: [
              {
                required: formaDePago === FormaDePago.cr,
                message: 'Ingresa el número de días',
              },
            ],
          }}
          precision={0}
          min={0}
          disabled={formaDePago === FormaDePago.Contado}
          onChange={val => {
            if (!val) form.setFieldValue('fecha_vencimiento', undefined)
            else
              form.setFieldValue(
                'fecha_vencimiento',
                dayjs().add(Number(val), 'days')
              )
          }}
        />
      </LabelBase>
      <LabelBase
        label='Fecha Vencimiento:'
        classNames={{ labelParent: 'mb-6' }}
      >
        <DatePickerBase
          propsForm={{
            name: 'fecha_vencimiento',
            rules: [
              {
                required: formaDePago === FormaDePago.cr,
                message: 'Ingresa la fecha de vencimiento',
              },
            ],
          }}
          placeholder='Fecha de Vencimiento'
          prefix={
            <FaCalendar
              size={15}
              className={`${
                formaDePago === FormaDePago.cr
                  ? 'text-rose-700'
                  : 'text-cyan-600'
              } mx-1`}
            />
          }
          disabled={formaDePago === FormaDePago.Contado}
          onChange={val => {
            if (!val) form.setFieldValue('numero_dias', undefined)
            else
              form.setFieldValue(
                'numero_dias',
                val.diff(dayjs().startOf('day'), 'days')
              )
          }}
          className='!w-[160px] !min-w-[160px] !max-w-[160px]'
        />
      </LabelBase>
      <FormMetodoPagoCompra form={form} />
    </>
  )
}
