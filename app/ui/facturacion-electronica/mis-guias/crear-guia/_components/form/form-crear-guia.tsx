import { FaCalendar, FaTruck, FaUserTag } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import { Form, FormInstance, Tag } from 'antd'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectBase from '~/app/_components/form/selects/select-base'
import SelectMotivoTraslado from '~/app/_components/form/selects/select-motivo-traslado'
import { TbTruckDelivery } from 'react-icons/tb'
import SelectClientes from '~/app/_components/form/selects/select-clientes'
import RadioDireccionCliente from '~/app/_components/form/radio-direccion-cliente'
import { useEffect, useState, useCallback } from 'react'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectChoferes from '~/app/_components/form/selects/select-choferes'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'

// Motivos SUNAT que requieren Comprador (distinto al destinatario)
const MOTIVOS_CON_COMPRADOR = ['03', '14']

export default function FormCrearGuia({
  form,
  guia,
  venta,
}: {
  form: FormInstance
  guia?: any
  venta?: any
}) {
  const [codigoMotivo, setCodigoMotivo] = useState<string>('')

  const requiereComprador = MOTIVOS_CON_COMPRADOR.includes(codigoMotivo)

  // Inicializar D1 al montar el componente
  useEffect(() => {
    if (!form.getFieldValue('direccion_seleccionada')) {
      form.setFieldValue('direccion_seleccionada', 'D1')
    }
  }, [form])

  // Limpiar comprador cuando el motivo cambia y ya no lo requiere
  useEffect(() => {
    if (!requiereComprador) {
      form.setFieldValue('comprador_id', undefined)
      form.setFieldValue('comprador_nombre', undefined)
    }
  }, [requiereComprador, form])

  const handleMotivoChange = useCallback((_value: number, motivoTraslado?: MotivoTraslado) => {
    setCodigoMotivo(motivoTraslado?.codigo || '')
  }, [])

  return (
    <div className='flex flex-col gap-2'>
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

      {/* Fila 1: Fechas, Serie, Número, Motivo */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4'>
        <LabelBase label='Fecha Emisión:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
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
        <LabelBase label='Fecha Traslado:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
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
        <LabelBase label='Serie:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
          <InputBase
            propsForm={{
              name: 'serie',
            }}
            placeholder='T001'
            className='w-full sm:!w-[100px] sm:!min-w-[100px] sm:!max-w-[100px]'
          />
        </LabelBase>
        <LabelBase label='Número:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
          <InputNumberBase
            propsForm={{
              name: 'numero',
            }}
            placeholder='000012'
            className='w-full sm:!w-[120px] sm:!min-w-[120px] sm:!max-w-[120px]'
          />
        </LabelBase>
        <ConfigurableElement
          componentId='crear-guia.motivo-traslado'
          label='Campo Motivo de Traslado'
        >
          <LabelBase label='Motivo de Traslado:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
            <SelectMotivoTraslado
              form={form}
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
              className='w-full sm:!min-w-[200px] sm:!w-[200px]'
              onChange={handleMotivoChange}
            />
          </LabelBase>
        </ConfigurableElement>
      </div>

      {/* Fila 2: DNI/RUC Destinatario, Cliente, Radio Dirección */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4 items-start'>
        <ConfigurableElement
          componentId='crear-guia.dni-ruc'
          label='Campo DNI/RUC'
        >
          <LabelBase
            label={requiereComprador ? 'Destinatario (DNI/RUC):' : 'DNI/RUC:'}
            classNames={{ labelParent: 'mb-2' }}
            className='w-full sm:w-auto'
          >
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              clienteOptionsDefault={venta?.cliente ? [venta.cliente] : []}
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
                  const nombreCompleto = cliente.razon_social
                    ? cliente.razon_social
                    : `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
                  form.setFieldValue('cliente_nombre', nombreCompleto)

                  const direcciones = cliente.direcciones || [];
                  const d1 = direcciones.find((d: any) => d.tipo === 'D1')?.direccion || '';
                  const d2 = direcciones.find((d: any) => d.tipo === 'D2')?.direccion || '';
                  const d3 = direcciones.find((d: any) => d.tipo === 'D3')?.direccion || '';
                  const d4 = direcciones.find((d: any) => d.tipo === 'D4')?.direccion || '';

                  form.setFieldValue('_cliente_direccion_1', d1);
                  form.setFieldValue('_cliente_direccion_2', d2);
                  form.setFieldValue('_cliente_direccion_3', d3);
                  form.setFieldValue('_cliente_direccion_4', d4);

                  const direccionSeleccionada = form.getFieldValue('direccion_seleccionada') || 'D1';
                  let direccionActual = d1;
                  if (direccionSeleccionada === 'D2') direccionActual = d2;
                  if (direccionSeleccionada === 'D3') direccionActual = d3;
                  if (direccionSeleccionada === 'D4') direccionActual = d4;
                  form.setFieldValue('punto_llegada', direccionActual);
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
            label={requiereComprador ? 'Destinatario:' : 'Cliente:'}
            classNames={{ labelParent: 'mb-2' }}
            className='w-full sm:flex-1'
          >
            <InputBase
              propsForm={{
                name: 'cliente_nombre',
                hasFeedback: false,
                className: 'w-full',
              }}
              placeholder={requiereComprador ? 'Nombre del destinatario (quien recibe)' : 'Nombre del cliente'}
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
          <div className='mb-2'>
            <RadioDireccionCliente form={form} />
          </div>
        </ConfigurableElement>
      </div>

      {/* Fila 2.5: Comprador - solo para motivos 03 y 14 */}
      {requiereComprador && (
        <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4 items-start'>
          <div className='w-full'>
            <Tag color='blue' className='!text-xs !mb-2'>
              <FaUserTag className='inline mr-1' />
              Motivo "{codigoMotivo}" requiere Comprador (quien paga) ademas del Destinatario (quien recibe)
            </Tag>
          </div>
          <LabelBase
            label='Comprador (DNI/RUC):'
            classNames={{ labelParent: 'mb-2' }}
            className='w-full sm:w-auto'
          >
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: 'comprador_id',
                hasFeedback: false,
                className: 'w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]',
                rules: [
                  {
                    required: true,
                    message: 'Selecciona el comprador',
                  },
                ],
              }}
              className='w-full'
              classNameIcon='text-blue-600 mx-1'
              placeholder='DNI/RUC comprador'
              onChange={(_, cliente) => {
                if (cliente) {
                  const nombre = cliente.razon_social
                    ? cliente.razon_social
                    : `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
                  form.setFieldValue('comprador_nombre', nombre)
                } else {
                  form.setFieldValue('comprador_nombre', '')
                }
              }}
            />
          </LabelBase>
          <LabelBase
            label='Comprador:'
            classNames={{ labelParent: 'mb-2' }}
            className='w-full sm:flex-1'
          >
            <InputBase
              propsForm={{
                name: 'comprador_nombre',
                hasFeedback: false,
                className: 'w-full',
              }}
              placeholder='Nombre del comprador (quien paga)'
              className='w-full'
              readOnly
              uppercase={false}
            />
          </LabelBase>
        </div>
      )}

      {/* Fila 3: Tipo Guía, Modalidad, Vehículo, Chofer */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4'>
        <LabelBase label='Tipo de Guía:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
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
            className='w-full sm:!min-w-[280px] sm:!w-[280px]'
            prefix={<TbTruckDelivery className='text-cyan-700 mx-1' />}
            options={[
              { label: 'GRE - Remitente', value: 'ELECTRONICA_REMITENTE' },
              { label: 'GRE - Transportista', value: 'ELECTRONICA_TRANSPORTISTA' },
              { label: 'Guía Física', value: 'FISICA' },
            ]}
          />
        </LabelBase>
        <ConfigurableElement
          componentId='crear-guia.modalidad'
          label='Campo Modalidad'
        >
          <LabelBase label='Modalidad:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
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
              className='w-full sm:!min-w-[180px] sm:!w-[180px]'
              options={[
                { label: 'Transporte privado', value: 'PRIVADO' },
                { label: 'Transporte público', value: 'PUBLICO' },
              ]}
            />
          </LabelBase>
        </ConfigurableElement>
        <ConfigurableElement
          componentId='crear-guia.vehiculo'
          label='Campo Vehículo'
        >
          <LabelBase label='Vehículo (Placa):' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
            <InputBase
              propsForm={{
                name: 'vehiculo_placa',
              }}
              placeholder='ABC-123'
              prefix={<FaTruck className='text-cyan-700 mx-1' />}
              className='w-full sm:!w-[140px] sm:!min-w-[140px]'
            />
          </LabelBase>
        </ConfigurableElement>
        <ConfigurableElement
          componentId='crear-guia.chofer'
          label='Campo Chofer'
        >
          <LabelBase label='Chofer:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:flex-1'>
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

      {/* Fila 4: Punto de Partida y Punto de Llegada */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4'>
        <LabelBase label='Punto de Partida:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:flex-1'>
          <InputBase
            propsForm={{
              name: 'punto_partida',
              rules: [
                {
                  required: true,
                  message: 'Ingresa el punto de partida',
                },
              ],
            }}
            placeholder='Dirección del punto de partida'
            className='w-full'
          />
        </LabelBase>
        <LabelBase label='Punto de Llegada:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:flex-1'>
          <InputBase
            propsForm={{
              name: 'punto_llegada',
              rules: [
                {
                  required: true,
                  message: 'Ingresa el punto de llegada',
                },
              ],
            }}
            placeholder='Dirección del punto de llegada'
            className='w-full'
          />
        </LabelBase>
      </div>
    </div>
  )
}
