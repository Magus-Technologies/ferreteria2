'use client'

import { Form, Select, Modal, Input, Segmented, message } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaCalendarAlt, FaMapMarkedAlt, FaTruck, FaCheck } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import TitleForm from '~/components/form/title-form'
import SelectAlmacen from '~/app/_components/form/selects/select-almacen'
import SelectDespachadores from '~/app/_components/form/selects/select-despachadores'
import SelectVehiculos from '~/app/_components/form/selects/select-vehiculos'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import TablaProductosEntrega from '../tables/tabla-productos-entrega'
import ModalCalendarioSlot from '~/app/ui/facturacion-electronica/mis-ventas/crear-venta/_components/modals/modal-calendario-slot'
import { useProductosEntrega } from '../../_hooks/use-productos-entrega'
import useCreateEntrega from '../../_hooks/use-create-entrega'
import { useStoreAlmacen } from '~/store/store-almacen'
import { useAuth } from '~/lib/auth-context'
import { apiRequest } from '~/lib/api'
import { clienteApi, type TipoDireccion } from '~/lib/api/cliente'
import { TipoEntrega, TipoDespacho, EstadoEntrega, TipoPedido, QuienEntrega } from '~/lib/api/entrega-producto'
import { QueryKeys } from '~/app/_lib/queryKeys'
import type { getVentaResponseProps } from '~/lib/api/venta'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import dynamic from 'next/dynamic'

dayjs.locale('es')

const MapaDireccionMapbox = dynamic(
  () => import('../maps/mapa-direccion-mapbox'),
  { ssr: false }
)

interface Coordenadas {
  lat: number
  lng: number
}

interface ModalEntregaDomicilioProps {
  open: boolean
  setOpen: (open: boolean) => void
  venta?: getVentaResponseProps
  onCambiarTipo?: () => void
}

export default function ModalEntregaDomicilio({
  open,
  setOpen,
  venta,
  onCambiarTipo,
}: ModalEntregaDomicilioProps) {
  const [form] = Form.useForm()
  const almacen_id = useStoreAlmacen((state) => state.almacen_id)
  const { user } = useAuth()

  const { productosEntrega, setProductosEntrega } = useProductosEntrega(venta, open)

  const { crearEntrega, loading } = useCreateEntrega({
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
      setProductosEntrega([])
    },
  })

  // State
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(TipoPedido.INTERNO)
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null)
  const [ubicacionGps, setUbicacionGps] = useState('')
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<TipoDireccion | null>(null)
  const [modalCalendario, setModalCalendario] = useState(false)
  const [slot, setSlot] = useState<{ start: Date; end: Date } | null>(null)

  // Watched form values
  const despachadorId = Form.useWatch('despachador_id', form) as string | undefined
  const cargoDestino = Form.useWatch('cargo_destino', form) as string | undefined
  const direccionEntrega = Form.useWatch('direccion_entrega', form) as string | undefined

  // Cargar cargos para pedido externo
  const { data: cargos = [] } = useQuery({
    queryKey: ['catalogos', 'cargos'],
    queryFn: async () => {
      const result = await apiRequest<{ data: { codigo: string; descripcion: string }[] }>('/catalogos/cargos')
      return result.data?.data || []
    },
  })

  // Cargar direcciones del cliente
  const clienteId = venta?.cliente_id ? Number(venta.cliente_id) : undefined
  const { data: direccionesData } = useQuery({
    queryKey: [QueryKeys.DIRECCIONES_CLIENTE, clienteId],
    queryFn: async () => {
      if (!clienteId) return { data: { data: [] } }
      return clienteApi.listarDirecciones(clienteId)
    },
    enabled: open && !!clienteId,
  })

  const direcciones = direccionesData?.data?.data || []

  // Init form
  useEffect(() => {
    if (open && venta) {
      form.setFieldsValue({ almacen_salida_id: almacen_id })
    } else if (!open) {
      form.resetFields()
      setProductosEntrega([])
      setSlot(null)
      setCoordenadas(null)
      setUbicacionGps('')
      setMostrarMapa(false)
      setDireccionSeleccionada(null)
      setTipoPedido(TipoPedido.INTERNO)
    }
  }, [open, venta, almacen_id, form, setProductosEntrega])

  // Cargar dirección inicial
  useEffect(() => {
    if (open && direcciones.length > 0 && !direccionSeleccionada) {
      const primera = direcciones[0]
      setDireccionSeleccionada(primera.tipo as TipoDireccion)
      form.setFieldValue('direccion_entrega', primera.direccion)
      if (primera.latitud && primera.longitud) {
        const coords = { lat: Number(primera.latitud), lng: Number(primera.longitud) }
        setCoordenadas(coords)
        obtenerUbicacionGps(coords.lat, coords.lng)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, direcciones])

  // Reverse geocoding
  const obtenerUbicacionGps = useCallback(async (lat: number, lng: number) => {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token) return
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1&language=es`
      )
      const data = await res.json()
      if (data.features?.[0]?.place_name) setUbicacionGps(data.features[0].place_name)
    } catch (err) {
      console.error('Error en geocodificación inversa:', err)
    }
  }, [])

  const handleCoordenadaChange = useCallback((nuevas: Coordenadas, dir?: string) => {
    setCoordenadas(nuevas)
    if (dir) setUbicacionGps(dir)
  }, [])

  const handleDireccionChange = useCallback((tipo: TipoDireccion) => {
    setDireccionSeleccionada(tipo)
    const d = direcciones.find(d => d.tipo === tipo)
    if (d) {
      form.setFieldValue('direccion_entrega', d.direccion)
      if (d.latitud && d.longitud) {
        const coords = { lat: Number(d.latitud), lng: Number(d.longitud) }
        setCoordenadas(coords)
        setMostrarMapa(true)
        obtenerUbicacionGps(coords.lat, coords.lng)
      } else {
        setCoordenadas(null)
        setUbicacionGps('')
      }
    }
  }, [direcciones, form, obtenerUbicacionGps])

  const handleTipoPedidoChange = (value: TipoPedido) => {
    setTipoPedido(value)
    if (value === TipoPedido.INTERNO) {
      form.setFieldValue('cargo_destino', undefined)
    } else {
      form.setFieldValue('despachador_id', undefined)
    }
  }

  const handleAplicarSlot = (s: { start: Date; end: Date }) => {
    setSlot(s)
  }

  const clienteNombre = venta?.cliente?.razon_social ||
    `${venta?.cliente?.nombres || ''} ${venta?.cliente?.apellidos || ''}`.trim() ||
    'CLIENTES VARIOS'

  // Validation
  const domicilioInvalido =
    !slot ||
    !direccionEntrega?.trim() ||
    (tipoPedido === TipoPedido.INTERNO && !despachadorId) ||
    (tipoPedido === TipoPedido.EXTERNO && !cargoDestino)

  const handleConfirmar = () => {
    const values = form.getFieldsValue()

    if (productosEntrega.length === 0) {
      message.error('No hay productos pendientes de entrega')
      return
    }

    const productosConCantidad = productosEntrega.filter(p => p.entregar > 0)
    if (productosConCantidad.length === 0) {
      message.error('Debe especificar cantidades a entregar')
      return
    }

    if (!values.almacen_salida_id) {
      message.error('Debe seleccionar un almacén de salida')
      return
    }

    if (!slot) {
      message.error('Debe seleccionar fecha y hora de entrega')
      return
    }

    if (!venta || !user?.id) return

    crearEntrega({
      venta_id: venta.id,
      tipo_entrega: TipoEntrega.DESPACHO,
      tipo_despacho: TipoDespacho.PROGRAMADO,
      estado_entrega: EstadoEntrega.PENDIENTE,
      fecha_entrega: dayjs().format('YYYY-MM-DD'),
      fecha_programada: dayjs(slot.start).format('YYYY-MM-DD'),
      hora_inicio: dayjs(slot.start).format('HH:mm'),
      hora_fin: dayjs(slot.end).format('HH:mm'),
      direccion_entrega: values.direccion_entrega || '',
      referencia_entrega: '',
      latitud: coordenadas?.lat,
      longitud: coordenadas?.lng,
      observaciones: values.observaciones || '',
      almacen_salida_id: values.almacen_salida_id,
      chofer_id: despachadorId || undefined,
      quien_entrega: despachadorId ? QuienEntrega.CHOFER : QuienEntrega.ALMACEN,
      user_id: user.id,
      tipo_pedido: tipoPedido,
      cargo_destino: cargoDestino || undefined,
      vehiculo_id: values.vehiculo_id || undefined,
      productos_entregados: productosConCantidad.map(p => ({
        unidad_derivada_venta_id: Number(p.unidad_derivada_venta_id),
        cantidad_entregada: p.entregar,
        ubicacion: p.ubicacion || undefined,
      })),
    })
  }

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          PROGRAMAR ENTREGA A DOMICILIO
          {venta && (
            <div className="text-sm font-normal text-gray-600 mt-1">
              🚚 Despacho a Domicilio — Venta N° {venta.serie}-{venta.numero} | Cliente: {clienteNombre}
              {onCambiarTipo && (
                <button
                  type="button"
                  onClick={onCambiarTipo}
                  className="ml-2 text-blue-500 hover:text-blue-700 underline text-xs cursor-pointer"
                >
                  (Cambiar tipo)
                </button>
              )}
            </div>
          )}
        </TitleForm>
      }
      open={open}
      onCancel={() => setOpen(false)}
      width={1000}
      centered
      footer={
        <div className="flex justify-between items-center">
          <ButtonBase color="default" size="md" onClick={() => setOpen(false)}>
            Cancelar
          </ButtonBase>
          <ButtonBase
            color="success"
            size="md"
            onClick={handleConfirmar}
            disabled={loading || domicilioInvalido}
          >
            {loading ? 'Procesando...' : 'Programar Entrega'}
          </ButtonBase>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <div className="space-y-4">
          {/* Almacén de salida */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Almacén de salida: <span className="text-red-500">*</span>
            </label>
            <SelectAlmacen
              propsForm={{
                name: 'almacen_salida_id',
                rules: [{ required: true, message: 'Seleccione un almacén' }],
              }}
              className="w-full"
              form={form}
            />
          </div>

          {/* Tipo de Pedido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Pedido:
            </label>
            <Segmented
              value={tipoPedido}
              onChange={(value) => handleTipoPedidoChange(value as TipoPedido)}
              options={[
                { value: TipoPedido.INTERNO, label: 'Asignar a usuario' },
                { value: TipoPedido.EXTERNO, label: 'Enviar a cargo' },
              ]}
              block
            />
          </div>

          {/* Despachador/Cargo + Calendario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              {tipoPedido === TipoPedido.INTERNO ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designar Despachador: <span className="text-red-500">*</span>
                  </label>
                  <SelectDespachadores
                    form={form}
                    propsForm={{ name: 'despachador_id' }}
                    placeholder="Sin asignar (todos lo verán)"
                    className="w-full"
                    allowClear
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cargo destino: <span className="text-red-500">*</span>
                  </label>
                  <Select
                    placeholder="Seleccionar cargo destino"
                    value={cargoDestino}
                    onChange={(v) => form.setFieldValue('cargo_destino', v)}
                    options={cargos.map(c => ({ value: c.codigo, label: c.descripcion }))}
                    className="w-full"
                  />
                </>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha y Hora: <span className="text-red-500">*</span>
              </label>
              {slot ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 font-medium flex items-center gap-2">
                    <FaCheck size={11} className="text-emerald-600 flex-shrink-0" />
                    <span>
                      {dayjs(slot.start).format('ddd D MMM')},{' '}
                      {dayjs(slot.start).format('HH:mm')} — {dayjs(slot.end).format('HH:mm')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalCalendario(true)}
                    className="text-slate-400 hover:text-slate-600 text-xs underline whitespace-nowrap"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <ButtonBase
                  color="info"
                  size="md"
                  type="button"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setModalCalendario(true)}
                >
                  <FaCalendarAlt size={14} />
                  Elegir en Calendario
                </ButtonBase>
              )}
            </div>
          </div>

          {/* Vehículo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FaTruck className="inline mr-1 text-orange-500" size={13} />
              Vehículo: <span className="text-gray-400 text-xs">(opcional)</span>
            </label>
            <SelectVehiculos
              form={form}
              propsForm={{ name: 'vehiculo_id' }}
              placeholder="Sin vehículo asignado"
              className="w-full"
              allowClear
            />
          </div>

          {/* Dirección y Mapa */}
          <div className="space-y-3">
            {direcciones.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar dirección del cliente:
                </label>
                <Select
                  placeholder="Seleccionar dirección"
                  value={direccionSeleccionada}
                  onChange={handleDireccionChange}
                  className="w-full"
                  options={direcciones.map(d => ({
                    value: d.tipo,
                    label: (
                      <div className="flex items-center justify-between">
                        <span>{d.direccion}</span>
                        <div className="flex items-center gap-2">
                          {d.es_principal && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Principal</span>
                          )}
                          {d.latitud && d.longitud && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">📍 GPS</span>
                          )}
                        </div>
                      </div>
                    ),
                  }))}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección: <span className="text-red-500">*</span>
                  </label>
                  <TextareaBase
                    propsForm={{ name: 'direccion_entrega' }}
                    placeholder="Dirección de entrega"
                    rows={3}
                  />
                  {ubicacionGps && (
                    <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded mt-1 truncate" title={ubicacionGps}>
                      Ubicación GPS: {ubicacionGps}
                    </p>
                  )}
                </div>
                <ButtonBase
                  color="info"
                  size="sm"
                  type="button"
                  className="flex items-center gap-2 text-sm"
                  onClick={() => setMostrarMapa(!mostrarMapa)}
                >
                  <FaMapMarkedAlt size={14} />
                  {mostrarMapa ? 'Ocultar' : 'Ver'} Mapa
                </ButtonBase>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones:
                  </label>
                  <TextareaBase
                    propsForm={{ name: 'observaciones' }}
                    placeholder="Observaciones (opcional)"
                    rows={3}
                  />
                </div>
              </div>

              <div>
                {mostrarMapa ? (
                  <div className="h-full min-h-[300px]">
                    <MapaDireccionMapbox
                      key={`${direccionSeleccionada}-${coordenadas?.lat}-${coordenadas?.lng}`}
                      direccion={form.getFieldValue('direccion_entrega') || ''}
                      clienteNombre={clienteNombre}
                      onCoordenadaChange={handleCoordenadaChange}
                      coordenadasIniciales={coordenadas}
                      editable
                    />
                  </div>
                ) : (
                  <div className="h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                    <FaMapMarkedAlt size={32} className="text-gray-300" />
                    <span>Click en &quot;Ver Mapa&quot; para marcar ubicación</span>
                    {coordenadas && (
                      <span className="text-xs text-green-600 font-mono">
                        Ubicación guardada: {coordenadas.lat.toFixed(4)}, {coordenadas.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Productos a entregar */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700">Productos a entregar:</div>
            <div className="text-sm font-bold text-blue-600">
              {productosEntrega.filter(p => p.entregar > 0).length} de {productosEntrega.length} seleccionado(s)
            </div>
          </div>

          <TablaProductosEntrega
            productos={productosEntrega}
            onProductoChange={setProductosEntrega}
          />
        </div>
      </Form>

      <ModalCalendarioSlot
        open={modalCalendario}
        onClose={() => setModalCalendario(false)}
        onAplicar={handleAplicarSlot}
        chofer_id={despachadorId}
      />
    </Modal>
  )
}
