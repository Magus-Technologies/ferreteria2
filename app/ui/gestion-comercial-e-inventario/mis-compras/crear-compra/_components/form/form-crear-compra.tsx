import { FaCalendar } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import SelectTipoMoneda from '~/app/_components/form/selects/select-tipo-moneda'
import { FormInstance } from 'antd'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import InputBase from '~/app/_components/form/inputs/input-base'
import { IoIosDocument } from 'react-icons/io'
import { IoDocumentAttach } from 'react-icons/io5'
import FormFormaDePagoCompra from './form-forma-de-pago-compra'
import { CompraConUnidadDerivadaNormal } from '../others/header'

export default function FormCrearCompra({
  form,
  compra,
}: {
  form: FormInstance
  compra?: CompraConUnidadDerivadaNormal
}) {
  const can = usePermission()
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
            onChangeTipoDeCambio={value =>
              form.setFieldValue('tipo_de_cambio', value)
            }
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
          />
        </LabelBase>
        <LabelBase label='Proveedor:' classNames={{ labelParent: 'mb-6' }}>
          <SelectProveedores
            allowClear
            showButtonCreate={can(permissions.PROVEEDOR_CREATE)}
            className='!w-[420px] !min-w-[420px] !max-w-[420px]'
            classNameIcon='text-rose-700 mx-1'
            proveedorOptionsDefault={
              compra?.proveedor ? [compra.proveedor] : []
            }
            propsForm={{
              name: 'proveedor_id',
              rules: [
                {
                  required: true,
                  message: 'Por favor, selecciona el proveedor',
                },
              ],
            }}
            form={form}
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
        <LabelBase label='Serie:' classNames={{ labelParent: 'mb-6' }}>
          <InputBase
            prefix={<IoIosDocument className='text-rose-700 mr-1' size={20} />}
            className='!w-[120px] !min-w-[120px] !max-w-[120px]'
            placeholder='Serie'
            propsForm={{
              name: 'serie',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa la serie',
                },
              ],
            }}
          />
        </LabelBase>
        <LabelBase label='N°:' classNames={{ labelParent: 'mb-6' }}>
          <InputNumberBase
            prefix={<IoIosDocument className='text-rose-700 mr-1' size={20} />}
            className='!w-[120px] !min-w-[120px] !max-w-[120px]'
            placeholder='Número'
            propsForm={{
              name: 'numero',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa el número',
                },
              ],
            }}
            precision={0}
            min={0}
          />
        </LabelBase>
        <LabelBase label='Guía:' classNames={{ labelParent: 'mb-6' }}>
          <InputBase
            prefix={
              <IoDocumentAttach className='text-cyan-600 mr-1' size={20} />
            }
            className='!w-[120px] !min-w-[120px] !max-w-[120px]'
            placeholder='Guía'
            propsForm={{
              name: 'guia',
            }}
          />
        </LabelBase>
      </div>
      <div className='flex gap-6'>
        <FormFormaDePagoCompra form={form} />
        <LabelBase label='Percepción:' classNames={{ labelParent: 'mb-6' }}>
          <InputNumberBase
            prefix={<IoIosDocument className='text-cyan-600 mr-1' size={20} />}
            className='!w-[120px] !min-w-[120px] !max-w-[120px]'
            placeholder='Percepción'
            propsForm={{
              name: 'percepcion',
            }}
            precision={2}
            min={0}
          />
        </LabelBase>
      </div>
    </div>
  )
}
