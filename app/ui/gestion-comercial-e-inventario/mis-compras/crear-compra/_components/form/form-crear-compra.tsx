import { FaCalendar } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import SelectTipoMoneda from '~/app/_components/form/selects/select-tipo-moneda'
import { FormInstance } from 'antd'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import SelectProveedores from '~/app/_components/form/selects/select-proveedores'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import SelectTipoDocumento from '~/app/_components/form/selects/select-tipo-documento'
import InputBase from '~/app/_components/form/inputs/input-base'
import { IoIosDocument } from 'react-icons/io'
import { IoDocumentAttach } from 'react-icons/io5'
import FormFormaDePagoCompra from './form-forma-de-pago-compra'
import { CompraConUnidadDerivadaNormal } from '../others/header'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

export default function FormCrearCompra({
  form,
  compra,
}: {
  form: FormInstance
  compra?: CompraConUnidadDerivadaNormal
}) {
  const { can } = usePermissionHook()
  return (
    <div className='flex flex-col'>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.campos-fecha-moneda-proveedor' label='Campos Fecha, Moneda y Proveedor'>
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
            disabled={(compra?.pagos_de_compras_count ?? 0) > 0}
            variant={compra?.pagos_de_compras_count ?? 0 > 0 ? 'borderless' : undefined}
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
            disabled={(compra?.pagos_de_compras_count ?? 0) > 0}
            readOnly={(compra?.pagos_de_compras_count ?? 0) > 0}
            variant={compra?.pagos_de_compras_count ?? 0 > 0 ? 'borderless' : undefined}
          />
        </LabelBase>
        <LabelBase label='RUC:' classNames={{ labelParent: 'mb-6' }}>
          <SelectProveedores
            form={form}
            showOnlyDocument={true}
            propsForm={{
              name: 'proveedor_id',
              hasFeedback: false,
              className: '!min-w-[150px] !w-[150px] !max-w-[150px]',
            }}
            className='w-full'
            classNameIcon='text-cyan-600 mx-1'
            placeholder='RUC'
            proveedorOptionsDefault={
              compra?.proveedor ? [compra.proveedor] : []
            }
            onChange={(_, proveedor) => {
              // Actualizar los campos relacionados
              if (proveedor) {
                // Actualizar RUC (solo el número)
                if (proveedor.ruc) {
                  form.setFieldValue('proveedor_ruc', proveedor.ruc)
                }

                // Actualizar razón social
                form.setFieldValue('proveedor_razon_social', proveedor.razon_social || '')
              } else {
                form.setFieldValue('proveedor_ruc', '')
                form.setFieldValue('proveedor_razon_social', '')
              }
            }}
          />
        </LabelBase>
        <LabelBase label='Proveedor:' classNames={{ labelParent: 'mb-6' }}>
          <InputBase
            propsForm={{
              name: 'proveedor_razon_social',
              hasFeedback: false,
              className: '!min-w-[250px] !w-[250px] !max-w-[250px]',
            }}
            placeholder='Razón Social del proveedor'
            className='w-full'
            readOnly
            uppercase={false}
          />
        </LabelBase>
      </div>
      </ConfigurableElement>
      <div className='flex gap-6'>
        <ConfigurableElement componentId='gestion-comercial.crear-compra.campo-tipo-documento' label='Campo Tipo Documento'>
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
        </ConfigurableElement>
        <ConfigurableElement componentId='gestion-comercial.crear-compra.campo-serie' label='Campo Serie'>
          <LabelBase label='Serie:' classNames={{ labelParent: 'mb-6' }}>
            <InputBase
              prefix={<IoIosDocument className='text-rose-700 mr-1' size={20} />}
              className='!w-[120px] !min-w-[120px] !max-w-[120px]'
              placeholder='Serie'
              propsForm={{
                name: 'serie',
              }}
            />
          </LabelBase>
        </ConfigurableElement>
        <ConfigurableElement componentId='gestion-comercial.crear-compra.campo-numero' label='Campo Número'>
          <LabelBase label='N°:' classNames={{ labelParent: 'mb-6' }}>
            <InputNumberBase
              prefix={<IoIosDocument className='text-rose-700 mr-1' size={20} />}
              className='!w-[120px] !min-w-[120px] !max-w-[120px]'
              placeholder='Número'
              propsForm={{
                name: 'numero',
              }}
              precision={0}
              min={0}
            />
          </LabelBase>
        </ConfigurableElement>
        <ConfigurableElement componentId='gestion-comercial.crear-compra.campo-guia' label='Campo Guía'>
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
        </ConfigurableElement>
        <ConfigurableElement componentId='gestion-comercial.crear-compra.campo-percepcion' label='Campo Percepción'>
          <LabelBase label='Percepción:' classNames={{ labelParent: 'mb-6' }}>
            <InputNumberBase
              prefix={<IoIosDocument className='text-cyan-600 mr-1' size={20} />}
              className='!w-[120px] !min-w-[120px] !max-w-[120px]'
              placeholder='Percepción'
              propsForm={{
                name: 'percepcion',
              }}
              disabled={(compra?.pagos_de_compras_count ?? 0) > 0}
              readOnly={(compra?.pagos_de_compras_count ?? 0) > 0}
              variant={compra?.pagos_de_compras_count ?? 0 > 0 ? 'borderless' : undefined}
              precision={2}
              min={0}
            />
          </LabelBase>
        </ConfigurableElement>
      </div>
      <ConfigurableElement componentId='gestion-comercial.crear-compra.forma-pago' label='Forma de Pago'>
      <div className='flex flex-wrap gap-6'>{(compra?.pagos_de_compras_count ?? 0) > 0 ? <div className='text-rose-700 text-xl font-semibold'>
        Tiene Pagos Asociados, no se puede cambiar los datos del pago.
      </div> :
        <FormFormaDePagoCompra form={form} />}
      </div>
      </ConfigurableElement>
    </div>
  )
}
