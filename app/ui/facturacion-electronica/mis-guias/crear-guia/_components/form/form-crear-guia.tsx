import { FaCalendar, FaTruck, FaUserTag, FaWarehouse } from 'react-icons/fa6'
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
import RadioDireccionEmpresa from '~/app/_components/form/radio-direccion-empresa'
import HiddenDireccionesFormItems from '~/app/_components/form/hidden-direcciones-form-items'
import {
  setDireccionesClienteToForm,
  clearDireccionesClienteFromForm,
  getDireccionFromForm,
} from '~/lib/utils/cliente-direcciones-form'
import { TipoDireccion } from '~/lib/api/cliente'
import { useEffect, useState, useCallback } from 'react'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectChoferes from '~/app/_components/form/selects/select-choferes'
import SelectUsuariosDespachadores from '~/app/_components/form/selects/select-usuarios-despachadores'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'
import { useQuery } from '@tanstack/react-query'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { Almacen } from '~/app/_types/almacen'

// Motivos SUNAT que requieren Comprador (distinto al destinatario)
const MOTIVOS_CON_COMPRADOR = ['03', '14']
// Motivo SUNAT: Traslado entre establecimientos de la misma empresa
const MOTIVO_ENTRE_ESTABLECIMIENTOS = '08'

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
  const esEntreEstablecimientos = codigoMotivo === MOTIVO_ENTRE_ESTABLECIMIENTOS

  // Watch sobre tipo_guia para mostrar campos específicos de GRE-Transportista.
  const tipoGuia = Form.useWatch('tipo_guia', form) as string | undefined
  const esTransportista = tipoGuia === 'ELECTRONICA_TRANSPORTISTA'

  // Watch sobre modalidad_transporte: si es PRIVADO, el chofer es un USER
  // (despachador interno, datos vienen de tabla `user`). Si es PUBLICO o
  // GRE-Transportista, se usa la tabla externa `chofer` con MTC.
  const modalidad = Form.useWatch('modalidad_transporte', form) as string | undefined
  const choferEsInterno = modalidad === 'PRIVADO' && !esTransportista

  // Limpiar remitente_id cuando se cambia de Transportista a otro tipo.
  useEffect(() => {
    if (!esTransportista) {
      form.setFieldValue('remitente_id', undefined)
      form.setFieldValue('remitente_nombre', undefined)
    }
  }, [esTransportista, form])

  // Al cambiar entre chofer interno (USER) y externo (tabla chofer),
  // limpiar el campo del modo opuesto para evitar enviar ambos al backend.
  useEffect(() => {
    if (choferEsInterno) {
      form.setFieldValue('chofer_id', undefined)
    } else {
      form.setFieldValue('user_chofer_id', undefined)
      form.setFieldValue('user_chofer_nombre', undefined)
    }
  }, [choferEsInterno, form])

  // Consultar almacenes (para motivo 08)
  const { data: almacenes } = useQuery({
    queryKey: [QueryKeys.ALMACENES],
    queryFn: async () => {
      const response = await almacenesApi.getAll()
      if (response.error) throw new Error(response.error.message)
      return response.data?.data || []
    },
    staleTime: 1000 * 60 * 5,
    enabled: esEntreEstablecimientos,
  })

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

  // Limpiar campos de cliente cuando cambia a motivo 08
  useEffect(() => {
    if (esEntreEstablecimientos) {
      form.setFieldValue('cliente_id', undefined)
      form.setFieldValue('cliente_nombre', undefined)
      form.setFieldValue('punto_partida', '')
      form.setFieldValue('punto_llegada', '')
    }
  }, [esEntreEstablecimientos, form])

  const handleMotivoChange = useCallback((_value: number, motivoTraslado?: MotivoTraslado) => {
    setCodigoMotivo(motivoTraslado?.codigo || '')
  }, [])

  const handleAlmacenOrigenChange = useCallback((value: number) => {
    const almacen = almacenes?.find((a: Almacen) => a.id === value)
    form.setFieldValue('punto_partida', almacen?.direccion || '')
  }, [almacenes, form])

  const handleAlmacenDestinoChange = useCallback((value: number) => {
    const almacen = almacenes?.find((a: Almacen) => a.id === value)
    form.setFieldValue('punto_llegada', almacen?.direccion || '')
  }, [almacenes, form])

  return (
    <div className='flex flex-col gap-2'>
      {/* Campos ocultos para direcciones del cliente */}
      <Form.Item name='direccion_seleccionada' hidden>
        <input type='hidden' />
      </Form.Item>
      <HiddenDireccionesFormItems />

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
        <LabelBase label='Referencia (Comprobante):' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
          <InputBase
            propsForm={{ name: 'referencia' }}
            placeholder='Ej: Factura F001-00000123'
            className='w-full sm:!min-w-[260px] sm:!w-[260px]'
            uppercase={false}
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

      {/* Fila 2: DNI/RUC Destinatario, Cliente, Radio Dirección — oculto para motivo 08 */}
      {!esEntreEstablecimientos && (
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

                    setDireccionesClienteToForm(form, cliente)

                    const seleccionada =
                      (form.getFieldValue('direccion_seleccionada') as TipoDireccion) ||
                      TipoDireccion.D1
                    form.setFieldValue('punto_llegada', getDireccionFromForm(form, seleccionada))
                  } else {
                    form.setFieldValue('cliente_nombre', '')
                    form.setFieldValue('punto_llegada', '')
                    clearDireccionesClienteFromForm(form)
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
      )}

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

      {/* Fila 2.6: Remitente — solo para GRE-Transportista. Cliente que
          contrata el servicio (dueño de la mercadería). Se mapea a
          `setTercero` de Greenter en el backend. */}
      {esTransportista && !esEntreEstablecimientos && (
        <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4 items-start'>
          <div className='w-full'>
            <Tag color='purple' className='!text-xs !mb-2'>
              <FaTruck className='inline mr-1' />
              GRE-Transportista: tu empresa transporta — el Remitente es el cliente que CONTRATA el servicio (dueño de la mercadería)
            </Tag>
          </div>
          <LabelBase
            label='Remitente (DNI/RUC):'
            classNames={{ labelParent: 'mb-2' }}
            className='w-full sm:w-auto'
          >
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: 'remitente_id',
                hasFeedback: false,
                className: 'w-full sm:!min-w-[150px] sm:!w-[150px] sm:!max-w-[150px]',
                rules: [
                  {
                    required: true,
                    message: 'Selecciona el remitente',
                  },
                ],
              }}
              className='w-full'
              classNameIcon='text-purple-600 mx-1'
              placeholder='DNI/RUC remitente'
              onChange={(_, cliente) => {
                if (cliente) {
                  const nombre = cliente.razon_social
                    ? cliente.razon_social
                    : `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim()
                  form.setFieldValue('remitente_nombre', nombre)
                } else {
                  form.setFieldValue('remitente_nombre', '')
                }
              }}
            />
          </LabelBase>
          <LabelBase
            label='Remitente:'
            classNames={{ labelParent: 'mb-2' }}
            className='w-full sm:flex-1'
          >
            <InputBase
              propsForm={{
                name: 'remitente_nombre',
                hasFeedback: false,
                className: 'w-full',
              }}
              placeholder='Nombre del remitente (quien contrata el transporte)'
              className='w-full'
              readOnly
              uppercase={false}
            />
          </LabelBase>
        </div>
      )}

      {/* Fila 2.5b: Almacenes Origen/Destino - solo para motivo 08 */}
      {esEntreEstablecimientos && (
        <div className='flex flex-col gap-2'>
          <Tag color='orange' className='!text-xs !w-fit'>
            <FaWarehouse className='inline mr-1' />
            Traslado entre establecimientos — el destinatario es la misma empresa
          </Tag>
          <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4'>
            <LabelBase label='Almacén Origen:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:flex-1'>
              <SelectBase
                propsForm={{
                  name: 'almacen_origen_id',
                  rules: [
                    {
                      required: true,
                      message: 'Selecciona el almacén de origen',
                    },
                  ],
                }}
                placeholder='Seleccione almacén origen...'
                className='w-full'
                prefix={<FaWarehouse className='text-orange-600 mx-1' />}
                options={almacenes?.map((a: Almacen) => ({
                  value: a.id,
                  label: `${a.name}${a.direccion ? ` — ${a.direccion}` : ''}`,
                }))}
                onChange={handleAlmacenOrigenChange}
              />
            </LabelBase>
            <LabelBase label='Almacén Destino:' classNames={{ labelParent: 'mb-2' }} className='w-full sm:flex-1'>
              <SelectBase
                propsForm={{
                  name: 'almacen_destino_id',
                  rules: [
                    {
                      required: true,
                      message: 'Selecciona el almacén de destino',
                    },
                  ],
                }}
                placeholder='Seleccione almacén destino...'
                className='w-full'
                prefix={<FaWarehouse className='text-green-600 mx-1' />}
                options={almacenes?.map((a: Almacen) => ({
                  value: a.id,
                  label: `${a.name}${a.direccion ? ` — ${a.direccion}` : ''}`,
                }))}
                onChange={handleAlmacenDestinoChange}
              />
            </LabelBase>
          </div>
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
              // { label: 'Guía Física', value: 'FISICA' },
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
          {choferEsInterno ? (
            // Transporte PRIVADO: el chofer es un USER (despachador interno).
            // Sus datos SUNAT (DNI, name, licencia) salen de la tabla `user`
            // en el backend. Se selecciona del listado de despachadores.
            <LabelBase
              label='Chofer (Despachador):'
              classNames={{ labelParent: 'mb-2' }}
              className='w-full sm:flex-1'
            >
              <SelectUsuariosDespachadores
                form={form}
                propsForm={{
                  name: 'user_chofer_id',
                  hasFeedback: false,
                  className: 'w-full',
                }}
                placeholder='Seleccionar despachador...'
                classNameIcon='text-cyan-600 mx-1'
              />
            </LabelBase>
          ) : (
            // Transporte PÚBLICO o GRE-Transportista: chofer EXTERNO con
            // MTC + DNI + licencia (tabla `chofer`).
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
          )}
        </ConfigurableElement>
      </div>

      {/* Fila 4: Punto de Partida y Punto de Llegada */}
      <div className='flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 lg:gap-4'>
        <LabelBase label='Referencia (Comprobante):' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
          <InputBase
            propsForm={{ name: 'referencia' }}
            placeholder='Ej: Factura F001-00000123'
            className='w-full sm:!min-w-[260px] sm:!w-[260px]'
            uppercase={false}
          />
        </LabelBase>
        <LabelBase label='Referencia (Comprobante):' classNames={{ labelParent: 'mb-2' }} className='w-full sm:w-auto'>
          <InputBase
            propsForm={{ name: 'referencia' }}
            placeholder='Ej: Factura F001-00000123'
            className='w-full sm:!min-w-[260px] sm:!w-[260px]'
            uppercase={false}
          />
        </LabelBase>
        <LabelBase
          label={
            <div className='flex items-center justify-between gap-2 w-full'>
              <span>Punto de Partida:</span>
              <RadioDireccionEmpresa form={form} fieldName='punto_partida' />
            </div>
          }
          classNames={{ labelParent: 'mb-2' }}
          className='w-full sm:flex-1'
        >
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
        {/* Campo oculto para guardar la selección D1..D4 de la empresa. */}
        <Form.Item name='empresa_direccion_seleccionada' hidden initialValue='D1'>
          <input type='hidden' />
        </Form.Item>
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
