import { FaCalendar } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import SelectTipoMoneda from '~/app/_components/form/selects/select-tipo-moneda'
import { FormInstance } from 'antd'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import { VentaConUnidadDerivadaNormal } from '../others/header-crear-venta'
import FormFormaDePagoVenta from './form-forma-de-pago-venta'
import SelectClientes from '~/app/_components/form/selects/select-clientes'

export default function FormCrearVenta({
  form,
  venta,
}: {
  form: FormInstance
  venta?: VentaConUnidadDerivadaNormal
}) {
  return (
    <div className='flex flex-col'>
      <div className='flex gap-6'>
        <LabelBase label='Fecha:' classNames={{ labelParent: 'mb-6' }}>
          <DatePickerBase
            propsForm={{
              name: 'fecha',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa la fecha',
                },
              ],
            }}
            placeholder='Fecha'
            className='!w-[160px] !min-w-[160px] !max-w-[160px]'
            prefix={<FaCalendar size={15} className='text-rose-700 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Tipo Moneda:' classNames={{ labelParent: 'mb-6' }}>
          <SelectTipoMoneda
            classNameIcon='text-rose-700 mx-1'
            className='!w-[120px] !min-w-[120px] !max-w-[120px]'
            propsForm={{
              name: 'tipo_moneda',
              rules: [
                {
                  required: true,
                  message: 'Por favor, selecciona el tipo de moneda',
                },
              ],
            }}
            onChangeTipoDeCambio={(value) =>
              form.setFieldValue('tipo_de_cambio', value)
            }
            // disabled={(compra?._count?.pagos_de_compras ?? 0) > 0}
            // variant={compra?._count?.pagos_de_compras ?? 0 > 0 ? 'borderless' : undefined}
          />
        </LabelBase>
        <LabelBase label='Tipo de Cambio:' classNames={{ labelParent: 'mb-6' }}>
          <InputNumberBase
            propsForm={{
              name: 'tipo_de_cambio',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el tipo de cambio',
                },
              ],
            }}
            prefix={<span className='text-rose-700 font-bold'>S/. </span>}
            precision={4}
            min={1}
            className='!w-[100px] !min-w-[100px] !max-w-[100px]'
            // disabled={(compra?._count?.pagos_de_compras ?? 0) > 0}
            // readOnly={(compra?._count?.pagos_de_compras ?? 0) > 0}
            // variant={compra?._count?.pagos_de_compras ?? 0 > 0 ? 'borderless' : undefined}
          />
        </LabelBase>
      </div>
      <div className='flex gap-6'>
        <LabelBase label='Tipo Documento:' classNames={{ labelParent: 'mb-6' }}>
          <SelectTipoDocumento
            propsForm={{
              name: 'tipo_documento',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
              rules: [
                {
                  required: true,
                  message: 'Selecciona el tipo de documento',
                },
              ],
            }}
            className='w-full'
            classNameIcon='text-rose-700 mx-1'
          />
        </LabelBase>
        <LabelBase label='Cliente:' classNames={{ labelParent: 'mb-6' }}>
          <SelectClientes
            propsForm={{
              name: 'cliente_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
              rules: [
                {
                  required: true,
                  message: 'Selecciona el cliente',
                },
              ],
            }}
            className='w-full'
            classNameIcon='text-rose-700 mx-1'
          />
        </LabelBase>
        <LabelBase
          label='Recomendado por:'
          classNames={{ labelParent: 'mb-6' }}
        >
          <SelectClientes
            propsForm={{
              name: 'recomendado_por_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            classNameIcon='text-cyan-600 mx-1'
          />
        </LabelBase>
      </div>
      <div className='flex gap-6'>
        {
          // (compra?._count?.pagos_de_compras ?? 0) > 0 ? <div className='text-rose-700 text-xl font-semibold'>
          //   Tiene Pagos Asociados, no se puede cambiar los datos del pago.
          // </div> :
          <FormFormaDePagoVenta form={form} />
        }
      </div>
    </div>
  )
}
