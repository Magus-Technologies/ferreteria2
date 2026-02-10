import { Form, FormInstance } from 'antd'
import { FaCalendar } from 'react-icons/fa'
import { IoIosDocument } from 'react-icons/io'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectFormaDePago from '~/app/_components/form/selects/select-forma-de-pago'
import LabelBase from '~/components/form/label-base'
import dayjs from 'dayjs'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export interface FormFormaDePagoProps {
  form: FormInstance
  fieldNames?: {
    formaDePago?: string
    numeroDias?: string
    fechaVencimiento?: string
  }
  defaultFormaDePago?: 'co' | 'cr'
  labelNumeroDias?: string
}

export default function FormFormaDePago({
  form,
  fieldNames = {},
  defaultFormaDePago = 'co',
  labelNumeroDias = 'N° Días:',
}: FormFormaDePagoProps) {
  // Nombres de campos con valores por defecto
  const formaDePagoField = fieldNames.formaDePago || 'forma_de_pago'
  const numeroDiasField = fieldNames.numeroDias || 'numero_dias'
  const fechaVencimientoField = fieldNames.fechaVencimiento || 'fecha_vencimiento'

  // Observar el valor de forma de pago
  const formaDePago = Form.useWatch(formaDePagoField, form)

  return (
    <>
      <ConfigurableElement
        componentId="crear-venta.forma-pago-select"
        label="Campo Forma de Pago"
      >
        <LabelBase label="Forma de Pago:" classNames={{ labelParent: 'mb-6' }}>
          <SelectFormaDePago
            classNameIcon="text-rose-700 mx-1"
            className="!w-[135px] !min-w-[135px] !max-w-[135px]"
            propsForm={{
              name: formaDePagoField,
              initialValue: defaultFormaDePago,
              rules: [
                {
                  required: true,
                  message: 'Por favor, selecciona la forma de pago',
                },
              ],
            }}
          />
        </LabelBase>
      </ConfigurableElement>
      
      <ConfigurableElement
        componentId="crear-venta.numero-dias"
        label="Campo N° Días"
      >
        <LabelBase label={labelNumeroDias} classNames={{ labelParent: 'mb-6' }}>
          <InputNumberBase
            prefix={
              <IoIosDocument
                className={`${
                  formaDePago === 'cr' ? 'text-rose-700' : 'text-cyan-600'
                } mr-1`}
                size={20}
              />
            }
            className="!w-[90px] !min-w-[90px] !max-w-[90px]"
            placeholder="N° Días"
            propsForm={{
              name: numeroDiasField,
              rules: [
                {
                  required: formaDePago === 'cr',
                  message: 'Ingresa el número de días',
                },
              ],
            }}
            precision={0}
            min={0}
            disabled={formaDePago === 'co'}
            onChange={(val) => {
              if (!val) form.setFieldValue(fechaVencimientoField, undefined)
              else
                form.setFieldValue(
                  fechaVencimientoField,
                  dayjs().add(Number(val), 'days')
                )
            }}
          />
        </LabelBase>
      </ConfigurableElement>
      
      <ConfigurableElement
        componentId="crear-venta.fecha-vencimiento"
        label="Campo Fecha Vencimiento"
      >
        <LabelBase
          label="Fecha Vencimiento:"
          classNames={{ labelParent: 'mb-6' }}
        >
          <DatePickerBase
            propsForm={{
              name: fechaVencimientoField,
              rules: [
                {
                  required: formaDePago === 'cr',
                  message: 'Ingresa la fecha de vencimiento',
                },
              ],
            }}
            placeholder="Fecha de Vencimiento"
            prefix={
              <FaCalendar
                size={15}
                className={`${
                  formaDePago === 'cr' ? 'text-rose-700' : 'text-cyan-600'
                } mx-1`}
              />
            }
            disabled={formaDePago === 'co'}
            onChange={(val) => {
              if (!val) form.setFieldValue(numeroDiasField, undefined)
              else
                form.setFieldValue(
                  numeroDiasField,
                  val.diff(dayjs().startOf('day'), 'days')
                )
            }}
            className="!w-[160px] !min-w-[160px] !max-w-[160px]"
          />
        </LabelBase>
      </ConfigurableElement>
    </>
  )
}
