import { FaBuilding, FaCalendar, FaTruck, FaUserTag, FaWarehouse } from 'react-icons/fa6'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import LabelBase from '~/components/form/label-base'
import { Form, FormInstance, Tag, Input } from 'antd'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectTransportistas from '~/app/_components/form/selects/select-transportistas'
import SelectBase from '~/app/_components/form/selects/select-base'
import SelectMotivoTraslado from '~/app/_components/form/selects/select-motivo-traslado'
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
import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { guiaRemisionApi } from '~/lib/api/guia-remision'
import { subscribeModelChanged } from '~/lib/realtime-bus'
import { IoReload } from 'react-icons/io5'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'
import SelectChoferes from '~/app/_components/form/selects/select-choferes'
import SelectUsuariosDespachadores from '~/app/_components/form/selects/select-usuarios-despachadores'
import SelectVehiculos from '~/app/_components/form/selects/select-vehiculos'
import type { Vehiculo } from '~/lib/api/catalogos'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'
import { useQuery } from '@tanstack/react-query'
import { almacenesApi } from '~/lib/api/almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { Almacen } from '~/app/_types/almacen'
import { useEmpresaPublica } from '~/hooks/use-empresa-publica'
import { buildSlotsDireccionEmpresa } from '~/lib/utils/empresa-direcciones-form'

// Motivos SUNAT que requieren Comprador (distinto al destinatario)
const MOTIVOS_CON_COMPRADOR = ['03', '14']
// Motivo SUNAT: Traslado entre establecimientos de la misma empresa
const MOTIVO_ENTRE_ESTABLECIMIENTOS = '08'

export default function FormCrearGuia({
  form,
  guia,
  venta,
  cotizacion,
  initialMotivoCodigo,
}: {
  form: FormInstance
  guia?: any
  venta?: any
  cotizacion?: any
  initialMotivoCodigo?: string
}) {
  const [codigoMotivo, setCodigoMotivo] = useState<string>(initialMotivoCodigo || '')

  const requiereComprador = MOTIVOS_CON_COMPRADOR.includes(codigoMotivo)
  const esEntreEstablecimientos = codigoMotivo === MOTIVO_ENTRE_ESTABLECIMIENTOS

  // Watch sobre tipo_guia para mostrar campos específicos de GRE-Transportista.
  const tipoGuia = Form.useWatch('tipo_guia', form) as string | undefined
  const esTransportista = tipoGuia === 'ELECTRONICA_TRANSPORTISTA'
  const almacenOrigenId = Form.useWatch('almacen_origen_id', form) as number | undefined

  // Watch sobre modalidad_transporte: si es PRIVADO, el chofer es un USER
  // (despachador interno, datos vienen de tabla `user`). Si es PUBLICO o
  // GRE-Transportista, se usa la tabla externa `chofer` con MTC.
  // Alimentan el display "Serie y Número" de arriba: se actualizan solos
  // cuando el preview o la carga de la guía escriben esos campos.
  const serieActual = Form.useWatch('serie', form) as string | undefined
  const numeroActual = Form.useWatch('numero', form) as number | string | undefined

  const modalidad = Form.useWatch('modalidad_transporte', form) as string | undefined
  const choferEsInterno = modalidad === 'PRIVADO' && !esTransportista
  // Sin modalidad seleccionada, los campos de vehículo y chofer se bloquean
  // para evitar inconsistencias (no sabemos si el chofer debe ser interno o externo).
  const sinModalidad = !modalidad

  // Datos del transportista TERCERO (Catálogo N° 18 SUNAT): solo aplica en
  // transporte PÚBLICO de GRE-Remitente. En GRE-Transportista la empresa
  // emisora YA es el transportista, no aplica.
  const requiereTransportista = modalidad === 'PUBLICO' && !esTransportista

  // Link de consulta manual al MTC. El portal MTC bloquea la IP del servidor
  // (datacenter extranjero), así que el autocompletado del N° MTC solo
  // funciona en local. En producción el usuario abre este link desde su
  // navegador (IP peruana), busca por RUC y copia el N° de registro al campo.
  const MTC_CONSULTA_URL = 'https://www.mtc.gob.pe/tramitesenlinea/tweb_tLinea/tw_consultadgtt/Frm_rep_intra_mercancia.aspx'

  // Vehículo asignado al despachador (para preseleccionar en SelectVehiculos)
  // y licencia del despachador (para mostrarla como info al usuario).
  // Ambos se llenan en el onChange de SelectUsuariosDespachadores.
  const [vehiculoDelDespachador, setVehiculoDelDespachador] = useState<Vehiculo | null>(null)
  const [licenciaDelDespachador, setLicenciaDelDespachador] = useState<string | null>(null)

  // Limpiar remitente_id cuando se cambia de Transportista a otro tipo.
  useEffect(() => {
    if (!esTransportista) {
      form.setFieldValue('remitente_id', undefined)
      form.setFieldValue('remitente_nombre', undefined)
    }
  }, [esTransportista, form])

  // Limpiar datos del transportista tercero cuando deja de aplicar
  // (modalidad distinta de PUBLICO, o pasa a ser GRE-Transportista).
  useEffect(() => {
    if (!requiereTransportista) {
      form.setFieldValue('transportista_ruc', undefined)
      form.setFieldValue('transportista_razon_social', undefined)
      form.setFieldValue('transportista_nro_mtc', undefined)
    }
  }, [requiereTransportista, form])

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

  // Slots de dirección de empresa (para auto-fill de puntos de partida/llegada)
  const { data: empresa } = useEmpresaPublica()
  const empresaSlots = useMemo(
    () => buildSlotsDireccionEmpresa(empresa?.direcciones),
    [empresa?.direcciones],
  )

  // Resuelve la dirección de un almacén: prioriza el slot de empresa asignado
  const resolveAlmacenAddress = useCallback(
    (almacen: Almacen | undefined) => {
      if (!almacen) return ''
      if (almacen.empresa_dir_slot) {
        const slot = empresaSlots.find((s) => s.tipo === almacen.empresa_dir_slot)
        if (slot?.direccion?.direccion) return slot.direccion.direccion
      }
      return almacen.direccion || ''
    },
    [empresaSlots],
  )

  // Inicializar D1 al montar el componente
  useEffect(() => {
    if (!form.getFieldValue('direccion_seleccionada')) {
      form.setFieldValue('direccion_seleccionada', 'D1')
    }
  }, [form])

  // Preview de serie/número (no reserva correlativo). Solo en creación: en
  // edición la guía ya trae su serie/número. Se refresca al cambiar el tipo
  // de guía (T001/V001/TF01) y vía socket cuando otra sesión crea una guía.
  // Si el usuario escribió serie/número manualmente, el socket NO los pisa
  // (solo el botón de refrescar fuerza la actualización).
  const ultimoAutoNumero = useRef<{ serie?: string; numero?: number }>({})

  const cargarSiguienteNumero = useCallback(
    (forzar = false) => {
      if (guia) return
      guiaRemisionApi
        .siguienteNumero(tipoGuia, almacenOrigenId || 1)
        .then((resp) => {
          const data = resp.data?.data
          if (!data) return
          const serieActual = form.getFieldValue('serie')
          const numeroActual = form.getFieldValue('numero')
          const esAutoOVacio =
            (!serieActual && !numeroActual) ||
            (serieActual === ultimoAutoNumero.current.serie &&
              numeroActual === ultimoAutoNumero.current.numero)
          if (forzar || esAutoOVacio) {
            form.setFieldValue('serie', data.serie)
            form.setFieldValue('numero', data.numero)
            ultimoAutoNumero.current = { serie: data.serie, numero: data.numero }
          }
        })
        .catch(() => {})
    },
    [form, guia, tipoGuia, almacenOrigenId],
  )

  useEffect(() => {
    if (guia) return
    cargarSiguienteNumero()
    const offRealtime = subscribeModelChanged((event) => {
      if (event.module === 'guias-remision') cargarSiguienteNumero()
    })
    return offRealtime
  }, [cargarSiguienteNumero, guia])

  // Limpiar comprador cuando el motivo cambia y ya no lo requiere
  useEffect(() => {
    if (!requiereComprador) {
      form.setFieldValue('comprador_id', undefined)
      form.setFieldValue('comprador_nombre', undefined)
    }
  }, [requiereComprador, form])

  // Limpiar campos de cliente cuando cambia a motivo 08
  // NO limpiamos punto_partida/punto_llegada: cuando se inicializa desde
  // transferencia, esos valores ya vienen de los almacenes y el efecto
  // de init se ejecuta ANTES que este efecto, pisándolos con ''.
  // Los almacen selects (handleAlmacenOrigenChange/DestinoChange) se
  // encargan de rellenarlos si el usuario cambia de almacén.
  useEffect(() => {
    if (esEntreEstablecimientos) {
      form.setFieldValue('cliente_id', undefined)
      form.setFieldValue('cliente_nombre', undefined)
    }
  }, [esEntreEstablecimientos, form])

  const handleMotivoChange = useCallback((_value: number, motivoTraslado?: MotivoTraslado) => {
    setCodigoMotivo(motivoTraslado?.codigo || '')
  }, [])

  const handleAlmacenOrigenChange = useCallback((value: number) => {
    const almacen = almacenes?.find((a: Almacen) => a.id === value)
    form.setFieldValue('punto_partida', resolveAlmacenAddress(almacen))
    if (almacen?.empresa_dir_slot) {
      form.setFieldValue('empresa_direccion_seleccionada', almacen.empresa_dir_slot)
    }
  }, [almacenes, form, resolveAlmacenAddress])

  const handleAlmacenDestinoChange = useCallback((value: number) => {
    const almacen = almacenes?.find((a: Almacen) => a.id === value)
    form.setFieldValue('punto_llegada', resolveAlmacenAddress(almacen))
  }, [almacenes, form, resolveAlmacenAddress])

  // Watch almacén origen para saber si tiene slot fijo → bloquear radio
  const almacenOrigenTieneSlot = !!(
    esEntreEstablecimientos &&
    almacenOrigenId &&
    almacenes?.find((a: Almacen) => a.id === almacenOrigenId)?.empresa_dir_slot
  )

  return (
    <div className='flex flex-col gap-2'>
      {/* Campos ocultos para direcciones del cliente */}
      <Form.Item name='direccion_seleccionada' hidden>
        {/* Input de Ant (controlado: normaliza undefined → '') para evitar el
            warning uncontrolled→controlled cuando use-init-guia setea 'D1'. */}
        <Input type='hidden' />
      </Form.Item>
      <HiddenDireccionesFormItems />

      {/* Fila 1: Fechas, Serie, Número, Referencia, Motivo.
          Grid responsive: 2 col en móvil, 4 en tablet, 8 en desktop —
          los campos se reacomodan sin anchos fijos que rompan el wrap. */}
      <div className='grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 lg:gap-4'>
        <LabelBase label='Fecha Emisión:' orientation='column' className='w-full'>
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
            className='w-full'
            prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
          />
        </LabelBase>
        <LabelBase label='Fecha Traslado:' orientation='column' className='w-full'>
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
            className='w-full'
            prefix={<FaCalendar size={15} className='text-cyan-700 mx-1' />}
          />
        </LabelBase>
        {/*
          Guía ELECTRÓNICA: se muestra el número completo ya formateado
          (TG01-00000004), como en crear-venta. Antes eran dos cajas sueltas
          —"TG01" y "4"— y no se leía de un vistazo cuál iba a ser el próximo
          documento. Va en solo lectura porque el correlativo lo asigna el
          SERVIDOR al guardar (ver GuiaRemisionService::crear): lo que se ve
          acá es una previsualización, no un campo editable.

          Guía FÍSICA: sí es editable. Son talonarios preimpresos y el número
          lo pone el papel, no el sistema.
        */}
        {tipoGuia !== 'FISICA' ? (
          <LabelBase
            label='Serie y Número:'
            orientation='column'
            className='w-full col-span-2'
          >
            <Input
              readOnly
              value={
                serieActual
                  ? `${serieActual}-${String(numeroActual ?? '').padStart(8, '0')}`
                  : ''
              }
              placeholder='Se asigna al guardar'
              className='w-full'
              suffix={
                !guia ? (
                  <IoReload
                    size={14}
                    title='Actualizar número'
                    className='cursor-pointer text-gray-400 hover:text-cyan-700 transition-colors'
                    onClick={() => cargarSiguienteNumero(true)}
                  />
                ) : undefined
              }
            />
            {/* Los valores reales siguen viviendo en el form. */}
            <Form.Item name='serie' hidden noStyle>
              <Input type='hidden' />
            </Form.Item>
            <Form.Item name='numero' hidden noStyle>
              <Input type='hidden' />
            </Form.Item>
          </LabelBase>
        ) : (
          <>
            <LabelBase label='Serie:' orientation='column' className='w-full'>
              <InputBase
                propsForm={{ name: 'serie' }}
                placeholder='TF01'
                className='w-full'
              />
            </LabelBase>
            <LabelBase label='Número:' orientation='column' className='w-full'>
              <InputNumberBase
                propsForm={{ name: 'numero' }}
                placeholder='000012'
                className='w-full'
              />
            </LabelBase>
          </>
        )}
        <LabelBase label='Referencia (Comprobante):' orientation='column' className='w-full col-span-2'>
          <InputBase
            propsForm={{ name: 'referencia' }}
            placeholder='Ej: Factura F001-00000123'
            className='w-full'
            uppercase={false}
          />
        </LabelBase>
        <ConfigurableElement
          componentId='crear-guia.motivo-traslado'
          label='Campo Motivo de Traslado'
          className='col-span-2'
        >
          <LabelBase label='Motivo de Traslado:' orientation='column' className='w-full col-span-2'>
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
              className='w-full'
              onChange={handleMotivoChange}
            />
          </LabelBase>
        </ConfigurableElement>
      </div>

      {/* Fila 2: DNI/RUC Destinatario, Cliente, Radio Dirección — oculto para motivo 08 */}
      {!esEntreEstablecimientos && (
        <div className='grid grid-cols-1 md:grid-cols-[230px_1fr_auto] gap-2 sm:gap-3 lg:gap-4 items-start'>
          <ConfigurableElement
            componentId='crear-guia.dni-ruc'
            label='Campo DNI/RUC'
          >
            <LabelBase
              label={requiereComprador ? 'Destinatario (DNI/RUC):' : 'DNI/RUC:'}
              orientation='column'
              className='w-full'
            >
              <SelectClientes
                form={form}
                showOnlyDocument={true}
                // `guia?.cliente` primero: al EDITAR no hay venta ni cotización
                // en contexto, así que el select se quedaba sin la opción del
                // cliente y mostraba el `cliente_id` crudo (un número suelto)
                // en vez del DNI/RUC.
                clienteOptionsDefault={
                  guia?.cliente
                    ? [guia.cliente]
                    : venta?.cliente
                      ? [venta.cliente]
                      : cotizacion?.cliente
                        ? [cotizacion.cliente]
                        : []
                }
                propsForm={{
                  name: 'cliente_id',
                  hasFeedback: false,
                  // flex-1 + min-w-0: deja sitio fijo a la lupa dentro de la
                  // celda del grid (con w-full el ícono colapsaba a 0px).
                  className: 'flex-1 min-w-0',
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
              orientation='column'
              className='w-full'
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
            <div className='md:self-end md:pb-1'>
              <RadioDireccionCliente form={form} />
            </div>
          </ConfigurableElement>
        </div>
      )}

      {/* Fila 2.5: Comprador - solo para motivos 03 y 14 */}
      {requiereComprador && (
        <div className='grid grid-cols-1 md:grid-cols-[230px_1fr] gap-2 sm:gap-3 lg:gap-4 items-start'>
          <div className='w-full md:col-span-2'>
            <Tag color='blue' className='!text-xs !mb-2'>
              <FaUserTag className='inline mr-1' />
              Motivo "{codigoMotivo}" requiere Comprador (quien paga) ademas del Destinatario (quien recibe)
            </Tag>
          </div>
          <LabelBase
            label='Comprador (DNI/RUC):'
            orientation='column'
            className='w-full'
          >
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: 'comprador_id',
                hasFeedback: false,
                className: 'flex-1 min-w-0',
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
            orientation='column'
            className='w-full'
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
        <div className='grid grid-cols-1 md:grid-cols-[230px_1fr] gap-2 sm:gap-3 lg:gap-4 items-start'>
          <div className='w-full md:col-span-2'>
            <Tag color='purple' className='!text-xs !mb-2'>
              <FaTruck className='inline mr-1' />
              GRE-Transportista: tu empresa transporta — el Remitente es el cliente que CONTRATA el servicio (dueño de la mercadería)
            </Tag>
          </div>
          <LabelBase
            label='Remitente (DNI/RUC):'
            orientation='column'
            className='w-full'
          >
            <SelectClientes
              form={form}
              showOnlyDocument={true}
              propsForm={{
                name: 'remitente_id',
                hasFeedback: false,
                className: 'flex-1 min-w-0',
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
            orientation='column'
            className='w-full'
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4'>
            <LabelBase label='Almacén Origen:' orientation='column' className='w-full'>
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
            <LabelBase label='Almacén Destino:' orientation='column' className='w-full'>
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

      {/* Fila 3: Vehículo, Chofer.
          (Tipo de Guía y Modalidad se movieron al header, junto al buscador
          de productos — ver header-crear-guia.) */}
      <div className='grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr] gap-2 sm:gap-3 lg:gap-4'>
        <ConfigurableElement
          componentId='crear-guia.vehiculo'
          label='Campo Vehículo'
        >
          <LabelBase label='Vehículo (Placa):' orientation='column' className='w-full'>
            {choferEsInterno ? (
              // PRIVADO: lupa que abre modal de vehículos. Se preselecciona el
              // vehículo asignado al despachador (campo `vehiculo_id` del user).
              // El usuario puede cambiarlo manualmente eligiendo otro.
              <SelectVehiculos
                propsForm={{ name: 'vehiculo_id_interno' }}
                vehiculoPreseleccionado={vehiculoDelDespachador}
                onChange={(_id, v) => {
                  form.setFieldValue('vehiculo_placa', v?.placa ?? '')
                }}
                allowClear
                showCreate={false}
                placeholder='Seleccionar vehículo...'
                className='w-full'
              />
            ) : (
              <InputBase
                disabled={sinModalidad}
                propsForm={{
                  name: 'vehiculo_placa',
                  // SUNAT exige la placa en la GRE. Normalmente se autocompleta
                  // al elegir el despachador, pero si ese no tiene vehículo
                  // asignado hay que cargarla a mano — antes se podía emitir sin
                  // ella y la guía salía incompleta.
                  rules: [{ required: true, message: 'Ingresá la placa del vehículo' }],
                }}
                placeholder={sinModalidad ? 'Seleccione modalidad' : 'ABC-123'}
                prefix={<FaTruck className='text-cyan-700 mx-1' />}
                className='w-full'
              />
            )}
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
              orientation='column'
              className='w-full'
            >
              <SelectUsuariosDespachadores
                form={form}
                disabled={sinModalidad}
                propsForm={{
                  name: 'user_chofer_id',
                  hasFeedback: false,
                  className: 'w-full',
                  // Obligatorio en transporte PRIVADO: los datos SUNAT del
                  // chofer (DNI, nombre, licencia) salen de este user, y sin
                  // ellos la GRE es rechazada. No lo era, y por eso se
                  // emitieron guías sin chofer ni placa.
                  // En PÚBLICO el chofer es externo (`chofer_id`), no este.
                  rules:
                    modalidad === 'PRIVADO'
                      ? [{ required: true, message: 'Seleccioná el despachador que transporta' }]
                      : [],
                }}
                placeholder={sinModalidad ? 'Seleccione modalidad primero' : 'Seleccionar despachador...'}
                classNameIcon='text-rose-700 mx-1'
                onChange={(_id, usuario) => {
                  // Auto-rellenar placa con el vehículo asignado al despachador
                  // (el usuario puede cambiarlo desde la lupa de Vehículo).
                  if (usuario?.vehiculo) {
                    setVehiculoDelDespachador(usuario.vehiculo as Vehiculo)
                    form.setFieldValue('vehiculo_placa', usuario.vehiculo.placa ?? '')
                  } else {
                    setVehiculoDelDespachador(null)
                  }
                  // Mostrar licencia del despachador (el backend la lee del modelo
                  // user al guardar; este display es solo informativo).
                  setLicenciaDelDespachador(usuario?.licencia_conducir ?? null)
                }}
              />
              {licenciaDelDespachador && (
                <span className='text-xs text-gray-500 mt-1 block'>
                  Licencia: <span className='font-semibold text-gray-700'>{licenciaDelDespachador}</span>
                </span>
              )}
            </LabelBase>
          ) : (
            // Transporte PÚBLICO o GRE-Transportista: chofer EXTERNO con
            // MTC + DNI + licencia (tabla `chofer`).
            <LabelBase label='Chofer:' orientation='column' className='w-full'>
              <SelectChoferes
                form={form}
                disabled={sinModalidad}
                propsForm={{
                  name: 'chofer_id',
                  hasFeedback: false,
                  className: 'w-full',
                }}
                placeholder={sinModalidad ? 'Seleccione modalidad primero' : 'Buscar Chofer'}
                className='w-full'
                classNameIcon='text-cyan-600 mx-1'
              />
            </LabelBase>
          )}
        </ConfigurableElement>
      </div>

      {/* Fila 3.5: Datos del Transportista — solo transporte PÚBLICO en
          GRE-Remitente. Catálogo N° 18 SUNAT: exige RUC y razón social de
          la empresa de transporte tercera que ejecuta el traslado. */}
      {requiereTransportista && (
        <div className='grid grid-cols-1 md:grid-cols-[260px_1fr_180px] gap-2 sm:gap-3 lg:gap-4 items-start'>
          <div className='w-full md:col-span-3'>
            <Tag color='gold' className='!text-xs !mb-2'>
              <FaBuilding className='inline mr-1' />
              Transporte público: informa la empresa transportista tercera (Catálogo N° 18 SUNAT)
            </Tag>
          </div>
          <LabelBase
            label='RUC Transportista:'
            orientation='column'
            className='w-full'
          >
            {/* Select con búsqueda en catálogo (como el de clientes): escribí
                RUC o razón social para elegir uno guardado, o un RUC nuevo de
                11 dígitos para consultarlo en SUNAT y autocompletar. La lupa
                y el modal de búsqueda/creación ya vienen embebidos en el
                propio select (igual que SelectChoferes). */}
            <SelectTransportistas
              propsForm={{
                name: 'transportista_ruc',
                hasFeedback: false,
                // flex-1 + min-w-0: deja sitio fijo a la lupa dentro de la
                // celda del grid (con w-full el ícono colapsaba a 0px).
                className: 'flex-1 min-w-0',
                rules: [
                  {
                    required: true,
                    message: 'Ingresa el RUC del transportista',
                  },
                  {
                    pattern: /^\d{11}$/,
                    message: 'El RUC debe tener 11 dígitos',
                  },
                ],
              }}
              className='w-full'
              onChange={t => {
                form.setFieldValue('transportista_razon_social', t.razon_social)
                form.setFieldValue('transportista_nro_mtc', t.nro_mtc ?? '')
              }}
            />
          </LabelBase>
          <LabelBase
            label='Razón Social Transportista:'
            orientation='column'
            className='w-full'
          >
            <InputBase
              propsForm={{
                name: 'transportista_razon_social',
                hasFeedback: false,
                rules: [
                  {
                    required: true,
                    message: 'Ingresa la razón social del transportista',
                  },
                ],
              }}
              placeholder='Nombre de la empresa transportista'
              className='w-full'
              uppercase={false}
            />
          </LabelBase>
          <LabelBase
            label={
              <div className='flex items-center justify-between gap-2 w-full'>
                <span>N° Registro MTC:</span>
                {/* Consulta manual en el portal MTC (se abre en el navegador
                    del usuario, con IP peruana). Copiar el código al campo. */}
                <a
                  href={MTC_CONSULTA_URL}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-xs font-normal text-cyan-600 hover:text-cyan-700 hover:underline whitespace-nowrap'
                  title='Buscar el N° de Registro MTC en el portal del MTC por RUC'
                >
                  Consultar en MTC ↗
                </a>
              </div>
            }
            orientation='column'
            classNames={{ labelParent: 'w-full', label: 'w-full' }}
            className='w-full'
          >
            <InputBase
              propsForm={{
                name: 'transportista_nro_mtc',
                hasFeedback: false,
              }}
              placeholder='Opcional'
              className='w-full'
              uppercase={false}
            />
          </LabelBase>
        </div>
      )}

      {/* Fila 4: Punto de Partida y Punto de Llegada */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4'>
        <LabelBase
          label={
            <div className='flex items-center justify-between gap-2 w-full'>
              <span>Punto de Partida:</span>
              <RadioDireccionEmpresa
                form={form}
                fieldName='punto_partida'
                disabled={almacenOrigenTieneSlot}
              />
            </div>
          }
          orientation='column'
          classNames={{ labelParent: 'w-full', label: 'w-full' }}
          className='w-full'
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
          <Input type='hidden' />
        </Form.Item>
        <LabelBase label='Punto de Llegada:' orientation='column' className='w-full'>
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
