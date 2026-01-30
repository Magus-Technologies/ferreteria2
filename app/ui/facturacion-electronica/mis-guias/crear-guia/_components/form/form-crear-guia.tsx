import { FaCalendar, FaTruck } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import { Form, FormInstance } from 'antd'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import SelectMotivoTraslado from '~/app/_components/form/selects/select-motivo-traslado'
import { TbTruckDelivery } from 'react-icons/tb'
import TextAreaBase from '~/app/_components/form/inputs/textarea-base'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import { BsGeoAltFill } from 'react-icons/bs'
import RadioDireccionCliente from '~/app/_components/form/radio-direccion-cliente'
import { useEffect } from 'react'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectChoferes from '~/app/_components/form/selects/select-choferes'

export default function FormCrearGuia({
  form,
  guia,
}: {
  form: FormInstance
  guia?: any
}) {
  // Inicializar D1 al montar el componente
  useEffect(() => {
    if (!form.getFieldValue('direccion_seleccionada')) {
      form.setFieldValue('direccion_seleccionada', 'D1')
    }
  }, [form])

  return (
    <div className='flex flex-col gap-4'>
      {/* Campos ocultos para direcciones del cliente */}
      <Form.Item name='direccion_seleccionada' hidden>
        <input type='hidden' />
      </Form.Item>
      <Form.Item name='_cliente_direccion_1' hidden>
        <input type='hidden' />
      </Form.Item>
      <Form.Item name='_cliente_direccion_2' hidden>
        <input type='hidden' />
      </Form.Item>
      <Form.Item name='_cliente_direccion_3' hidden>
        <input type='hidden' />
      </Form.Item>
      <Form.Item name='_cliente_direccion_4' hidden>
        <input type='hidden' />
      </Form.Item>

      {/* Primera fila: Fechas y Afecta Stock */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Fecha Emisión:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <DatePickerBase
            propsForm={{
              name: 'fecha_emision',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa la fecha de emisión',
                },
              ],
            }}
            placeholder='Fecha Emisión'
            className='w-full sm:!w-[160px] sm:!min-w-[160px] sm:!max-w-[160px]'
            prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Fecha Traslado:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <DatePickerBase
            propsForm={{
              name: 'fecha_traslado',
              rules: [
                {
                  required: true,
                  message: 'Por favor, ingresa la fecha de traslado',
                },
              ],
            }}
            placeholder='Fecha Traslado'
            className='w-full sm:!w-[160px] sm:!min-w-[160px] sm:!max-w-[160px]'
            prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Afecta Stock:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <SelectBase
            propsForm={{
              name: 'afecta_stock',
              rules: [
                {
                  required: true,
                  message: 'Selecciona si afecta stock',
                },
              ],
            }}
            className='w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]'
            options={[
              { label: 'Sí', value: 'true' },
              { label: 'No', value: 'false' },
            ]}
          />
        </LabelBase>
      </div>
      
      {/* Segunda fila: Serie, Número, Destino */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Serie:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <InputBase
            propsForm={{
              name: 'serie',
            }}
            placeholder='T001'
            className='w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]'
          />
        </LabelBase>
        <LabelBase label='Número:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <InputNumberBase
            propsForm={{
              name: 'numero',
            }}
            placeholder='000012'
            className='w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]'
          />
        </LabelBase>
        <LabelBase label='Destino:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
          <SelectBase
            propsForm={{
              name: 'destino_id',
            }}
            placeholder='Seleccione Destino...'
            className='w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]'
            options={[
              { label: 'Almacén Principal', value: 1 },
              { label: 'Almacén Secundario', value: 2 },
            ]}
          />
        </LabelBase>
      </div>
      
      {/* Tercera fila: DNI/RUC, Cliente, Punto de Llegada y Radio */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6 items-start'>
        <ConfigurableElement
          componentId='crear-guia.dni-ruc'
          label='Campo DNI/RUC'
        >
          <LabelBase
            label='DNI/RUC:'
            classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }}
            className='w-full sm:w-auto'
          >
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: 'cliente_id',
                hasFeedback: false,
                className: 'w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]',
              }}
              className='w-full'
              classNameIcon='text-rose-700 mx-1'
              placeholder='DNI/RUC'
              onChange={(_, cliente) => {
                if (cliente) {
                  // Actualizar nombre del cliente
                  const nombreCompleto = cliente.razon_social
                    ? cliente.razon_social
                    : `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
                  form.setFieldValue('cliente_nombre', nombreCompleto)

                  // Guardar las 4 direcciones en campos ocultos
                  form.setFieldValue('_cliente_direccion_1', cliente.direccion || '')
                  form.setFieldValue('_cliente_direccion_2', cliente.direccion_2 || '')
                  form.setFieldValue('_cliente_direccion_3', cliente.direccion_3 || '')
                  form.setFieldValue('_cliente_direccion_4', cliente.direccion_4 || '')

                  // Actualizar punto de llegada según dirección seleccionada
                  const direccionSeleccionada = form.getFieldValue('direccion_seleccionada') || 'D1'
                  let direccionActual = cliente.direccion || ''
                  if (direccionSeleccionada === 'D2') direccionActual = cliente.direccion_2 || ''
                  if (direccionSeleccionada === 'D3') direccionActual = cliente.direccion_3 || ''
                  if (direccionSeleccionada === 'D4') direccionActual = cliente.direccion_4 || ''
                  form.setFieldValue('punto_llegada', direccionActual)
                } else {
                  form.setFieldValue('cliente_nombre', '')
                  form.setFieldValue('punto_llegada', '')
                  form.setFieldValue('_cliente_direccion_1', '')
                  form.setFieldValue('_cliente_direccion_2', '')
                  form.setFieldValue('_cliente_direccion_3', '')
                  form.setFieldValue('_cliente_direccion_4', '')
                }
              }}
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId='crear-guia.cliente-nombre'
          label='Campo Nombre Cliente'
        >
          <LabelBase
            label='Cliente:'
            classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }}
            className='w-full sm:flex-1'
          >
            <InputBase
              propsForm={{
                name: 'cliente_nombre',
                hasFeedback: false,
                className: 'w-full',
              }}
              placeholder='Nombre del cliente'
              className='w-full'
              readOnly
              uppercase={false}
            />
          </LabelBase>
        </ConfigurableElement>

        <ConfigurableElement
          componentId='crear-guia.radio-direccion'
          label='Selector de Dirección'
        >
          <div className='mb-3 sm:mb-4 lg:mb-6'>
            <RadioDireccionCliente form={form} />
          </div>
        </ConfigurableElement>
      </div>
      
      {/* Cuarta fila: Referencia */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <ConfigurableElement
          componentId='crear-guia.referencia'
          label='Campo Referencia'
        >
          <LabelBase label='Referencia:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
            <InputBase
              propsForm={{
                name: 'referencia',
              }}
              placeholder='Referencia'
              className='w-full'
            />
          </LabelBase>
        </ConfigurableElement>
      </div>
      
      {/* Quinta fila: Motivo de Traslado y Modalidad */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <ConfigurableElement
          componentId='crear-guia.motivo-traslado'
          label='Campo Motivo de Traslado'
        >
          <LabelBase label='Motivo de Traslado:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
            <SelectMotivoTraslado
              propsForm={{
                name: 'motivo_traslado',
                rules: [
                  {
                    required: true,
                    message: 'Selecciona el motivo de traslado',
                  },
                ],
              }}
              placeholder='Seleccione motivo...'
              className='w-full'
            />
          </LabelBase>
        </ConfigurableElement>
        <ConfigurableElement
          componentId='crear-guia.modalidad'
          label='Campo Modalidad'
        >
          <LabelBase label='Modalidad:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
            <SelectBase
              propsForm={{
                name: 'modalidad_transporte',
                rules: [
                  {
                    required: true,
                    message: 'Selecciona la modalidad',
                  },
                ],
              }}
              placeholder='Seleccione...'
              className='w-full sm:!min-w-[200px] sm:!w-[200px] sm:!max-w-[200px]'
              options={[
                { label: 'Transporte privado', value: 'PRIVADO' },
                { label: 'Transporte público', value: 'PUBLICO' },
              ]}
            />
          </LabelBase>
        </ConfigurableElement>
      </div>
      
      {/* Sexta fila: Vehículo y Chofer */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <ConfigurableElement
          componentId='crear-guia.vehiculo'
          label='Campo Vehículo'
        >
          <LabelBase label='Vehículo (Placa):' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:w-auto'>
            <InputBase
              propsForm={{
                name: 'vehiculo_placa',
              }}
              placeholder='ABC-123'
              prefix={<FaTruck className='text-cyan-700 mx-1' />}
              className='w-full sm:!w-[150px] sm:!min-w-[150px] sm:!max-w-[150px]'
            />
          </LabelBase>
        </ConfigurableElement>
        <ConfigurableElement
          componentId='crear-guia.chofer'
          label='Campo Chofer'
        >
          <LabelBase label='Chofer:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
            <SelectChoferes
              propsForm={{
                name: 'chofer_id',
                hasFeedback: false,
                className: 'w-full',
              }}
              className='w-full'
              classNameIcon='text-cyan-600 mx-1'
            />
          </LabelBase>
        </ConfigurableElement>
      </div>
      
      {/* Séptima fila: Punto de Partida y Punto de Llegada */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Punto de Partida:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
          <TextAreaBase
            propsForm={{
              name: 'punto_partida',
              rules: [
                {
                  required: true,
                  message: 'Ingresa el punto de partida',
                },
              ],
            }}
            placeholder='Dirección completa del punto de partida'
            rows={2}
            className='w-full'
          />
        </LabelBase>
        <LabelBase label='Punto de Llegada:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
          <TextAreaBase
            propsForm={{
              name: 'punto_llegada',
              rules: [
                {
                  required: true,
                  message: 'Ingresa el punto de llegada',
                },
              ],
            }}
            placeholder='Dirección completa del punto de llegada'
            rows={2}
            className='w-full'
          />
        </LabelBase>
      </div>
      
      {/* Octava fila: Tipo de Guía */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-6'>
        <LabelBase label='Tipo de Guía:' classNames={{ labelParent: 'mb-3 sm:mb-4 lg:mb-6' }} className='w-full sm:flex-1'>
          <SelectBase
            propsForm={{
              name: 'tipo_guia',
              rules: [
                {
                  required: true,
                  message: 'Selecciona el tipo de guía',
                },
              ],
            }}
            placeholder='Seleccione...'
            className='w-full'
            prefix={<TbTruckDelivery className='text-cyan-700 mx-1' />}
            options={[
              { label: 'GUIA REMISION ELECTRONICA - Remitente', value: 'ELECTRONICA_REMITENTE' },
              { label: 'GUIA REMISION ELECTRONICA - Transportista', value: 'ELECTRONICA_TRANSPORTISTA' },
              { label: 'GUIA REMISION FISICA', value: 'FISICA' },
            ]}
          />
        </LabelBase>
      </div>
    </div>
  )
}
