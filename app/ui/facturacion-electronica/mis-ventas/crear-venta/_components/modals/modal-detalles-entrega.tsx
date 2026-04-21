'use client'

import { Select, Modal, FormInstance, Form, Input, Switch, Segmented } from 'antd'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaCalendarAlt, FaMapMarkedAlt, FaUserEdit, FaCheck, FaTruck } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import SelectDespachadores from '~/app/_components/form/selects/select-despachadores'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import { apiRequest } from '~/lib/api'
import { TipoPedido } from '~/lib/api/entrega-producto'
import TitleForm from '~/components/form/title-form'
import dynamic from 'next/dynamic'
import useCreateVenta from '../../_hooks/use-create-venta'
import type { FormCreateVenta } from '../others/body-vender'
import TablaProductosEntrega from '../../../_components/tables/tabla-productos-entrega'
import type { ProductoEntrega } from '../../../_hooks/use-productos-entrega'
import TableWithTitle from '~/components/tables/table-with-title'
import { orangeColors } from '~/lib/colors'
import type { ColDef } from 'ag-grid-community'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { clienteApi, type TipoDireccion } from '~/lib/api/cliente'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalCalendarioSlot from './modal-calendario-slot'
import SelectVehiculos from '~/app/_components/form/selects/select-vehiculos'

dayjs.locale('es')

// Importar el mapa de Mapbox dinámicamente para evitar problemas de SSR
const MapaDireccionMapbox = dynamic(
  () => import('../../../_components/maps/mapa-direccion-mapbox'),
  { ssr: false }
)

interface Coordenadas {
  lat: number
  lng: number
}

interface ModalDetallesEntregaProps {
  open: boolean
  setOpen: (open: boolean) => void
  form: FormInstance
  ventaId?: string
  tipoDespacho: 'EnTienda' | 'Domicilio' | 'Parcial'
  onConfirmar: () => void
  onEditarCliente: () => void
  direccion?: string
  clienteNombre?: string
  clienteId?: number
}

export default function ModalDetallesEntrega({
  open,
  setOpen,
  form,
  ventaId,
  tipoDespacho,
  onConfirmar,
  onEditarCliente,
  direccion,
  clienteNombre,
  clienteId,
}: ModalDetallesEntregaProps) {
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null)
  const [productosEntrega, setProductosEntrega] = useState<ProductoEntrega[]>([])
  const [quienEntregaParcial, setQuienEntregaParcial] = useState<'almacen' | 'chofer'>('almacen')
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(TipoPedido.INTERNO)
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<TipoDireccion | null>(null)
  // Vehículo pre-seleccionado cuando el despachador tiene uno asignado por default
  const [vehiculoPreseleccionadoDomicilio, setVehiculoPreseleccionadoDomicilio] = useState<{ id: number; name: string; tipo: string; placa: string | null } | null>(null)
  // Estado para programar el resto del parcial
  const [programarResto, setProgramarResto] = useState(true)
  const [horaInicioResto, setHoraInicioResto] = useState<string | undefined>(undefined)
  const [horaFinResto, setHoraFinResto] = useState<string | undefined>(undefined)
  const [direccionResto, setDireccionResto] = useState<string>('')
  const [observacionesResto, setObservacionesResto] = useState<string>('')
  const [mostrarMapaResto, setMostrarMapaResto] = useState(false)
  const [coordenadasResto, setCoordenadasResto] = useState<Coordenadas | null>(null)
  const [direccionSeleccionadaResto, setDireccionSeleccionadaResto] = useState<TipoDireccion | null>(null)

  // Estados para el modal de calendario de slots
  const [modalCalendarioDomicilio, setModalCalendarioDomicilio] = useState(false)
  const [modalCalendarioResto, setModalCalendarioResto] = useState(false)
  const [slotDomicilio, setSlotDomicilio] = useState<{ start: Date; end: Date } | null>(null)
  const [slotResto, setSlotResto] = useState<{ start: Date; end: Date } | null>(null)

  // Hook para crear/actualizar venta
  const { handleSubmit: crearVenta, loading: creandoVenta } = useCreateVenta({ ventaId })

  // Cargar cargos para pedido externo
  const { data: cargos = [] } = useQuery({
    queryKey: ['catalogos', 'cargos'],
    queryFn: async () => {
      const result = await apiRequest<{ data: { codigo: string; descripcion: string }[] }>('/catalogos/cargos')
      return result.data?.data || []
    },
  })

  const handleTipoPedidoChange = (value: TipoPedido) => {
    setTipoPedido(value)
    form.setFieldValue('tipo_pedido', value)
    if (value === TipoPedido.INTERNO) {
      form.setFieldValue('cargo_destino', undefined)
    } else {
      form.setFieldValue('despachador_id', undefined)
    }
  }

  // Cargar direcciones del cliente
  const { data: direccionesData, isLoading: cargandoDirecciones } = useQuery({
    queryKey: [QueryKeys.DIRECCIONES_CLIENTE, clienteId],
    queryFn: async () => {
      if (!clienteId) return { data: { data: [] } }
      const response = await clienteApi.listarDirecciones(clienteId)
      return response
    },
    enabled: open && !!clienteId && (tipoDespacho === 'Domicilio' || tipoDespacho === 'Parcial'),
  })

  const direcciones = direccionesData?.data?.data || []

  // Cargar dirección inicial cuando se abra el modal
  useEffect(() => {
    if (open && tipoDespacho === 'Domicilio' && direcciones.length > 0) {
      // Setear almacenero por defecto como quien entrega en domicilio
      if (!form.getFieldValue('quien_entrega')) {
        form.setFieldValue('quien_entrega', 'almacen')
      }
      // Buscar la dirección seleccionada en el formulario principal
      const direccionSeleccionadaForm = form.getFieldValue('direccion_seleccionada') || 'D1'
      const direccionObj = direcciones.find(d => d.tipo === direccionSeleccionadaForm)
      
      if (direccionObj) {
        // Cargar la dirección seleccionada y referencia
        form.setFieldValue('direccion_entrega', direccionObj.direccion)
        form.setFieldValue('referencia_entrega', direccionObj.referencia || '')
        setDireccionSeleccionada(direccionObj.tipo as TipoDireccion)
        
        // Si tiene coordenadas, cargarlas
        if (direccionObj.latitud && direccionObj.longitud) {
          const coords = {
            lat: Number(direccionObj.latitud),
            lng: Number(direccionObj.longitud)
          }
          setCoordenadas(coords)
          form.setFieldValue('latitud', coords.lat)
          form.setFieldValue('longitud', coords.lng)
          obtenerUbicacionGps(coords.lat, coords.lng)
        } else {
          setUbicacionGps('')
        }
      } else if (direcciones.length > 0) {
        // Si no encuentra la seleccionada, usar la primera (D1)
        const primeraDir = direcciones[0]
        form.setFieldValue('direccion_entrega', primeraDir.direccion)
        form.setFieldValue('referencia_entrega', primeraDir.referencia || '')
        setDireccionSeleccionada(primeraDir.tipo as TipoDireccion)

        if (primeraDir.latitud && primeraDir.longitud) {
          const coords = {
            lat: Number(primeraDir.latitud),
            lng: Number(primeraDir.longitud)
          }
          setCoordenadas(coords)
          form.setFieldValue('latitud', coords.lat)
          form.setFieldValue('longitud', coords.lng)
          obtenerUbicacionGps(coords.lat, coords.lng)
        } else {
          setUbicacionGps('')
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipoDespacho, direcciones, form])

  // Obtener valores del formulario (reactivo)
  const despachadorId = Form.useWatch('despachador_id', form) as string | undefined
  const restoDespachadorId = Form.useWatch('_resto_despachador_id', form) as string | undefined
  const quienEntrega = Form.useWatch('quien_entrega', form) as string | undefined
  const direccionEntrega = Form.useWatch('direccion_entrega', form) as string | undefined
  const cargoDestino = Form.useWatch('cargo_destino', form) as string | undefined

  // Validación de campos obligatorios para Domicilio
  const domicilioInvalido =
    tipoDespacho === 'Domicilio' &&
    (
      !slotDomicilio ||
      !direccionEntrega?.trim() ||
      (tipoPedido === TipoPedido.INTERNO && !despachadorId) ||
      (tipoPedido === TipoPedido.EXTERNO && !cargoDestino)
    )

  // Obtener productos del formulario
  const productos = Form.useWatch('productos', form) as FormCreateVenta['productos']

  // Inicializar cantidades de entrega cuando se abre el modal en modo Parcial
  // Setear almacenero por defecto en EnTienda
  useEffect(() => {
    if (open && tipoDespacho === 'EnTienda' && !form.getFieldValue('quien_entrega')) {
      form.setFieldValue('quien_entrega', 'almacen')
    }
  }, [open, tipoDespacho, form])

  useEffect(() => {
    if (open && tipoDespacho === 'Parcial' && productos && productos.length > 0) {
      const items: ProductoEntrega[] = productos.map((p, index) => ({
        id: index + 1,
        producto: p.producto_name,
        ubicacion: '',
        total: Number(p.cantidad),
        entregado: 0,
        pendiente: Number(p.cantidad),
        entregar: 0,
        unidad_derivada_venta_id: p.unidad_derivada_id,
      }))
      setProductosEntrega(items)
    }
  }, [open, tipoDespacho, productos])

  const handleEditarCliente = () => {
    onEditarCliente()
  }

  // Aplicar slot seleccionado desde el calendario (domicilio)
  const handleAplicarSlotDomicilio = (slot: { start: Date; end: Date }) => {
    setSlotDomicilio(slot)
    // Guardar como string para que getFieldsValue() lo lea correctamente
    form.setFieldValue('fecha_programada', dayjs(slot.start).format('YYYY-MM-DD'))
    form.setFieldValue('hora_inicio', dayjs(slot.start).format('HH:mm'))
    form.setFieldValue('hora_fin', dayjs(slot.end).format('HH:mm'))
  }

  // Aplicar slot seleccionado desde el calendario (resto parcial)
  const handleAplicarSlotResto = (slot: { start: Date; end: Date }) => {
    setSlotResto(slot)
    form.setFieldValue('_resto_fecha_programada', dayjs(slot.start).format('YYYY-MM-DD'))
    setHoraInicioResto(dayjs(slot.start).format('HH:mm'))
    setHoraFinResto(dayjs(slot.end).format('HH:mm'))
  }

  // Estado para la dirección GPS obtenida por reverse geocoding del mapa
  const [ubicacionGps, setUbicacionGps] = useState<string>('')

  // Reverse geocoding helper
  const obtenerUbicacionGps = useCallback(async (lat: number, lng: number) => {
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      if (!token) return
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&limit=1&language=es`
      )
      const data = await res.json()
      if (data.features?.[0]?.place_name) {
        setUbicacionGps(data.features[0].place_name)
      }
    } catch (err) {
      console.error('Error en geocodificación inversa:', err)
    }
  }, [])

  // Callback para cuando el usuario marca una ubicación en el mapa
  const handleCoordenadaChange = useCallback((nuevasCoordenadas: Coordenadas, direccionObtenida?: string) => {
    setCoordenadas(nuevasCoordenadas)
    form.setFieldValue('latitud', nuevasCoordenadas.lat)
    form.setFieldValue('longitud', nuevasCoordenadas.lng)
    if (direccionObtenida) setUbicacionGps(direccionObtenida)
  }, [form])

  // Manejar cambio de dirección seleccionada
  const handleDireccionChange = useCallback((tipo: TipoDireccion) => {
    setDireccionSeleccionada(tipo)
    const direccionObj = direcciones.find(d => d.tipo === tipo)
    
    if (direccionObj) {
      // Actualizar dirección y referencia en el formulario
      form.setFieldValue('direccion_entrega', direccionObj.direccion)
      form.setFieldValue('direccion_seleccionada', tipo)
      form.setFieldValue('referencia_entrega', direccionObj.referencia || '')

      // Si tiene coordenadas, cargarlas automáticamente
      if (direccionObj.latitud && direccionObj.longitud) {
        const coords = {
          lat: Number(direccionObj.latitud),
          lng: Number(direccionObj.longitud)
        }
        setCoordenadas(coords)
        form.setFieldValue('latitud', coords.lat)
        form.setFieldValue('longitud', coords.lng)
        setMostrarMapa(true) // Mostrar el mapa automáticamente
        obtenerUbicacionGps(coords.lat, coords.lng)
      } else {
        setCoordenadas(null)
        setUbicacionGps('')
        form.setFieldValue('latitud', undefined)
        form.setFieldValue('longitud', undefined)
      }
    }
  }, [direcciones, form, obtenerUbicacionGps])

  // Callback para cambio de dirección en sección "resto" del parcial
  const handleDireccionChangeResto = useCallback((tipo: TipoDireccion) => {
    setDireccionSeleccionadaResto(tipo)
    const direccionObj = direcciones.find(d => d.tipo === tipo)

    if (direccionObj) {
      setDireccionResto(direccionObj.direccion)

      if (direccionObj.latitud && direccionObj.longitud) {
        const coords = {
          lat: Number(direccionObj.latitud),
          lng: Number(direccionObj.longitud)
        }
        setCoordenadasResto(coords)
        setMostrarMapaResto(true)
      } else {
        setCoordenadasResto(null)
      }
    }
  }, [direcciones])

  // Callback para coordenadas del mapa del resto
  const handleCoordenadaChangeResto = useCallback((nuevasCoordenadas: Coordenadas) => {
    setCoordenadasResto(nuevasCoordenadas)
  }, [])

  // Setear tipo_despacho en el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      form.setFieldValue('tipo_despacho', tipoDespacho)
    }
  }, [open, tipoDespacho, form])

  // Columnas para la tabla de productos restantes (read-only)
  const columnDefsResto = useMemo<ColDef<ProductoEntrega>[]>(() => [
    {
      headerName: 'Producto',
      field: 'producto',
      flex: 1,
    },
    {
      headerName: 'Total',
      field: 'total',
      width: 100,
      valueFormatter: (params) => Number(params.value).toFixed(2),
    },
    {
      headerName: 'Entrega ahora',
      field: 'entregar',
      width: 130,
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: { color: '#16a34a', fontWeight: 'bold' } as Record<string, string>,
    },
    {
      headerName: 'Queda para después',
      width: 160,
      valueGetter: (params) => {
        if (!params.data) return 0
        return params.data.total - params.data.entregar
      },
      valueFormatter: (params) => Number(params.value).toFixed(2),
      cellStyle: { color: '#ea580c', fontWeight: 'bold' } as Record<string, string>,
    },
  ], [])

  // Verificar si hay algo que entregar
  const totalAEntregar = useMemo(
    () => productosEntrega.reduce((acc, item) => acc + item.entregar, 0),
    [productosEntrega],
  )

  const handleConfirmar = async () => {
    const ventaValues = form.getFieldsValue()

    if (tipoDespacho === 'Parcial') {
      // Entrega inmediata: las cantidades "entregar" ahora
      ventaValues.cantidades_parciales = productosEntrega.map((p) => ({
        producto_id: 0,
        producto_name: p.producto,
        producto_codigo: '',
        unidad_derivada_id: p.unidad_derivada_venta_id,
        unidad_derivada_name: '',
        total: p.total,
        entregado: p.entregado,
        pendiente: p.pendiente,
        entregar: p.entregar,
      }))
      ventaValues.quien_entrega = quienEntregaParcial

      // Entrega programada del resto: pasar los datos directamente en ventaValues
      // use-create-venta los leerá y creará la segunda entrega tras crear la venta
      const totalResto = productosEntrega.reduce((acc, p) => acc + (p.total - p.entregar), 0)
      const tieneResto = programarResto && totalResto > 0
      if (tieneResto) {
        const restoDespachadorId = form.getFieldValue('_resto_despachador_id')
        const restoFechaProgramada = form.getFieldValue('_resto_fecha_programada')
        const restoVehiculoId = form.getFieldValue('_resto_vehiculo_id')
        ventaValues.parcial_resto_programado = {
          despachador_id: restoDespachadorId,
          fecha_programada: restoFechaProgramada
            ? dayjs(restoFechaProgramada).format('YYYY-MM-DD')
            : undefined,
          hora_inicio: horaInicioResto,
          hora_fin: horaFinResto,
          direccion_entrega: direccionResto,
          observaciones: observacionesResto,
          vehiculo_id: restoVehiculoId || undefined,
        }
      }
    }

    await crearVenta(ventaValues)
    setOpen(false)
    onConfirmar()
  }

  const getTipoDespachoLabel = () => {
    switch (tipoDespacho) {
      case 'EnTienda':
        return 'Despacho en Tienda'
      case 'Domicilio':
        return 'Despacho a Domicilio'
      case 'Parcial':
        return 'Despacho Parcial'
    }
  }

  return (
    <Modal
      title={
        <TitleForm className="!pb-0">
          CONFIGURAR ENTREGA
          <div className="text-sm font-normal text-gray-600 mt-1">
            {getTipoDespachoLabel()}
          </div>
        </TitleForm>
      }
      open={open}
      onCancel={() => setOpen(false)}
      width={tipoDespacho === 'Parcial' ? 950 : 800}
      centered
      footer={
        <div className="flex justify-end gap-2">
          <ButtonBase
            color="default"
            size="md"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </ButtonBase>
          {(tipoDespacho === 'Parcial' || tipoDespacho === 'Domicilio') && (
            <ButtonBase
              color="warning"
              size="md"
              onClick={async () => {
                const ventaValues = form.getFieldsValue()
                await crearVenta(ventaValues)
                setOpen(false)
                onConfirmar()
              }}
              disabled={creandoVenta}
            >
              {creandoVenta ? 'Procesando...' : 'Omitir'}
            </ButtonBase>
          )}
          <ButtonBase
            color="success"
            size="md"
            onClick={handleConfirmar}
            disabled={creandoVenta || (tipoDespacho === 'Parcial' && totalAEntregar === 0) || domicilioInvalido}
          >
            {creandoVenta
              ? 'Procesando...'
              : tipoDespacho === 'EnTienda'
              ? 'Entregar Ahora'
              : tipoDespacho === 'Parcial'
              ? 'Entregar'
              : 'Programar Entrega'}
          </ButtonBase>
        </div>
      }
    >
      <div className="space-y-4 py-4">
        {/* Campos para Despacho en Tienda */}
        {tipoDespacho === 'EnTienda' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ¿Quién entrega? <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Seleccionar"
              value={quienEntrega || 'almacen'}
              onChange={(value) => form.setFieldValue('quien_entrega', value)}
              options={[
                { value: 'vendedor', label: 'Vendedor' },
                { value: 'almacen', label: 'Almacen' },
              ]}
              className="w-full"
            />
          </div>
        )}

        {/* Campos para Despacho a Domicilio (solo Domicilio, ya no Parcial) */}
        {tipoDespacho === 'Domicilio' && (
          <div className="space-y-4">
            {/* Campos ocultos para tipo_pedido y cargo_destino */}
            <div style={{ display: 'none' }}>
              <Form.Item name="tipo_pedido"><Input /></Form.Item>
              <Form.Item name="cargo_destino"><Input /></Form.Item>
            </div>

            {/* Tipo de Pedido + Asignación */}
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
                className="mb-3"
                block
              />
            </div>

            {/* Fila 1: Despachador/Cargo + botón calendario */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                {tipoPedido === TipoPedido.INTERNO ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Designar Despachador: <span className="text-red-500">*</span>
                    </label>
                    <SelectDespachadores
                      form={form}
                      propsForm={{
                        name: 'despachador_id',
                      }}
                      placeholder="Sin asignar (todos los despachadores lo verán)"
                      className="w-full"
                      allowClear
                      onChange={(_id, despachador) => {
                        // Auto-cargar el vehículo por defecto del despachador si tiene uno asignado
                        if (despachador?.vehiculo && despachador.vehiculo.id) {
                          form.setFieldValue('vehiculo_id', despachador.vehiculo.id)
                          setVehiculoPreseleccionadoDomicilio(despachador.vehiculo)
                        } else if (!despachador) {
                          // Se limpió el despachador → también limpiar el vehículo auto-seleccionado
                          form.setFieldValue('vehiculo_id', undefined)
                          setVehiculoPreseleccionadoDomicilio(null)
                        }
                      }}
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo destino: <span className="text-red-500">*</span>
                    </label>
                    <Select
                      placeholder="Seleccionar cargo destino"
                      value={form.getFieldValue('cargo_destino')}
                      onChange={(value) => form.setFieldValue('cargo_destino', value)}
                      options={cargos.map((c) => ({
                        value: c.codigo,
                        label: c.descripcion,
                      }))}
                      className="w-full"
                    />
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora: <span className="text-red-500">*</span>
                </label>
                {slotDomicilio ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 font-medium flex items-center gap-2">
                      <FaCheck size={11} className="text-emerald-600 flex-shrink-0" />
                      <span>
                        {dayjs(slotDomicilio.start).format('ddd D MMM')},{' '}
                        {dayjs(slotDomicilio.start).format('HH:mm')} —{' '}
                        {dayjs(slotDomicilio.end).format('HH:mm')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalCalendarioDomicilio(true)}
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
                    onClick={() => setModalCalendarioDomicilio(true)}
                  >
                    <FaCalendarAlt size={14} />
                    Elegir en Calendario
                  </ButtonBase>
                )}
                {/* Campos ocultos — registrados en el form para que getFieldsValue() los incluya */}
                <div style={{ display: 'none' }}>
                  <Form.Item name="fecha_programada"><Input /></Form.Item>
                  <Form.Item name="hora_inicio"><Input /></Form.Item>
                  <Form.Item name="hora_fin"><Input /></Form.Item>
                </div>
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
                vehiculoPreseleccionado={vehiculoPreseleccionadoDomicilio}
              />
              <div style={{ display: 'none' }}>
                <Form.Item name="vehiculo_id"><Input /></Form.Item>
              </div>
            </div>

            {/* Fila 3: Dirección, Referencia y Mapa (sin selector D1-D4) */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {/* Columna izquierda: Dirección y botones */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección: <span className="text-red-500">*</span>
                    </label>
                    <TextareaBase
                      propsForm={{
                        name: 'direccion_entrega',
                      }}
                      placeholder="Dirección de entrega (usa el mapa para marcar la ubicación)"
                      rows={2}
                    />
                    {ubicacionGps && (
                      <p className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded mt-1 truncate" title={ubicacionGps}>
                        📍 Ubicación GPS: {ubicacionGps}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referencia:
                    </label>
                    <TextareaBase
                      propsForm={{
                        name: 'referencia_entrega',
                      }}
                      placeholder="Ej: frente al parque, portón verde, etc."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <ButtonBase
                      color="info"
                      size="sm"
                      type="button"
                      className="flex items-center gap-2 text-sm flex-1"
                      onClick={() => setMostrarMapa(!mostrarMapa)}
                    >
                      <FaMapMarkedAlt size={14} />
                      {mostrarMapa ? 'Ocultar' : 'Ver'} Mapa
                    </ButtonBase>

                    <ButtonBase
                      color="warning"
                      size="sm"
                      type="button"
                      className="flex items-center gap-2 text-sm flex-1"
                      onClick={handleEditarCliente}
                    >
                      <FaUserEdit size={14} />
                      Editar Cliente
                    </ButtonBase>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones:
                    </label>
                    <TextareaBase
                      propsForm={{
                        name: 'observaciones',
                      }}
                      placeholder="Observaciones (opcional)"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Columna derecha: Mapa */}
                <div>
                  {mostrarMapa ? (
                    <div className="h-full min-h-[300px]">
                      <MapaDireccionMapbox
                        key={`${direccionSeleccionada}-${coordenadas?.lat}-${coordenadas?.lng}`}
                        direccion={form.getFieldValue('direccion_entrega') || direccion || ''}
                        clienteNombre={clienteNombre}
                        onCoordenadaChange={handleCoordenadaChange}
                        coordenadasIniciales={coordenadas}
                        editable={true}
                      />
                    </div>
                  ) : (
                    <div className="h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                      <FaMapMarkedAlt size={32} className="text-gray-300" />
                      <span>{direccion ? 'Click en "Ver Mapa" para marcar ubicación' : 'Sin dirección'}</span>
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
          </div>
        )}

        {/* Campos para Despacho Parcial - Tabla de productos */}
        {tipoDespacho === 'Parcial' && (
          <div className="space-y-4">
            {/* Selector de quién entrega */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                ¿Quién entrega? <span className="text-red-500">*</span>
              </label>
              <Select
                value={quienEntregaParcial}
                onChange={(value) => setQuienEntregaParcial(value)}
                options={[
                  { value: 'almacen', label: 'Almacen' },
                  { value: 'chofer', label: 'Chofer en Tienda' },
                ]}
                className="w-60"
              />
            </div>

            {/* Tabla AG Grid de productos */}
            <TablaProductosEntrega
              productos={productosEntrega}
              onProductoChange={setProductosEntrega}
            />

            {/* Resumen */}
            {totalAEntregar > 0 && (
              <div className="flex justify-end">
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
                  <span className="text-green-800 font-medium">
                    Total a entregar ahora: {totalAEntregar} unidad(es)
                  </span>
                </div>
              </div>
            )}

            {/* Sección: Programar entrega del resto */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={programarResto}
                  onChange={setProgramarResto}
                  size="small"
                />
                <span className="text-sm font-medium text-gray-700">
                  ¿Programar entrega del resto?
                </span>
                {productosEntrega.some(p => p.total - p.entregar > 0) && (
                  <span className="text-xs text-gray-500">
                    ({productosEntrega.reduce((acc, p) => acc + (p.total - p.entregar), 0)} unidad(es) pendiente(s))
                  </span>
                )}
              </div>

              {programarResto && productosEntrega.some(p => p.total - p.entregar > 0) && (
                <div className="mt-4 space-y-4">
                  {/* Tabla AG Grid de productos restantes - mismo componente que la tabla de arriba */}
                  <div style={{ height: '150px' }}>
                    <TableWithTitle<ProductoEntrega>
                      id="productos-entrega-resto"
                      title="Productos pendientes para entrega programada"
                      selectionColor={orangeColors[10]}
                      columnDefs={columnDefsResto}
                      rowData={productosEntrega.filter(p => p.total - p.entregar > 0)}
                    />
                  </div>

                  {/* Despachador, Vehículo y botón calendario */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Designar Despachador: <span className="text-red-500">*</span>
                      </label>
                      <SelectDespachadores
                        form={form}
                        propsForm={{ name: '_resto_despachador_id' }}
                        placeholder="Seleccionar despachador"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaTruck className="inline mr-1 text-orange-500" size={13} />
                        Vehículo:
                      </label>
                      <SelectVehiculos
                        form={form}
                        propsForm={{ name: '_resto_vehiculo_id' }}
                        placeholder="Sin vehículo"
                        className="w-full"
                        allowClear
                      />
                      <div style={{ display: 'none' }}>
                        <Form.Item name="_resto_vehiculo_id"><Input /></Form.Item>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha y Hora: <span className="text-red-500">*</span>
                      </label>
                      {slotResto ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-800 font-medium flex items-center gap-2">
                            <FaCheck size={11} className="text-emerald-600 flex-shrink-0" />
                            <span>
                              {dayjs(slotResto.start).format('ddd D MMM')},{' '}
                              {dayjs(slotResto.start).format('HH:mm')} —{' '}
                              {dayjs(slotResto.end).format('HH:mm')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setModalCalendarioResto(true)}
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
                          onClick={() => setModalCalendarioResto(true)}
                        >
                          <FaCalendarAlt size={14} />
                          Elegir en Calendario
                        </ButtonBase>
                      )}
                      {/* Campo oculto registrado en form */}
                      <div style={{ display: 'none' }}>
                        <Form.Item name="_resto_fecha_programada"><Input /></Form.Item>
                      </div>
                    </div>
                  </div>

                  {/* Selector de dirección del cliente */}
                  <div className="space-y-3">
                    {direcciones.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccionar dirección del cliente:
                        </label>
                        <Select
                          placeholder="Seleccionar dirección"
                          value={direccionSeleccionadaResto}
                          onChange={handleDireccionChangeResto}
                          className="w-full"
                          options={direcciones.map(d => ({
                            value: d.tipo,
                            label: (
                              <div className="flex items-center justify-between">
                                <span>{d.direccion}</span>
                                <div className="flex items-center gap-2">
                                  {d.es_principal && (
                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                      Principal
                                    </span>
                                  )}
                                  {d.latitud && d.longitud && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                      📍 GPS
                                    </span>
                                  )}
                                </div>
                              </div>
                            ),
                          }))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {direccionSeleccionadaResto && direcciones.find(d => d.tipo === direccionSeleccionadaResto)?.latitud
                            ? '✓ Coordenadas GPS cargadas automáticamente'
                            : 'Selecciona una dirección o ingresa una nueva abajo'}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      {/* Columna izquierda: Dirección y botones */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dirección de entrega: <span className="text-red-500">*</span>
                          </label>
                          <Input.TextArea
                            value={direccionResto}
                            onChange={(e) => setDireccionResto(e.target.value)}
                            placeholder="Dirección de entrega del resto"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <ButtonBase
                            color="info"
                            size="sm"
                            type="button"
                            className="flex items-center gap-2 text-sm flex-1"
                            onClick={() => setMostrarMapaResto(!mostrarMapaResto)}
                          >
                            <FaMapMarkedAlt size={14} />
                            {mostrarMapaResto ? 'Ocultar' : 'Ver'} Mapa
                          </ButtonBase>

                          <ButtonBase
                            color="warning"
                            size="sm"
                            type="button"
                            className="flex items-center gap-2 text-sm flex-1"
                            onClick={onEditarCliente}
                          >
                            <FaUserEdit size={14} />
                            Editar Cliente
                          </ButtonBase>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Observaciones:
                          </label>
                          <Input.TextArea
                            value={observacionesResto}
                            onChange={(e) => setObservacionesResto(e.target.value)}
                            placeholder="Observaciones (opcional)"
                            rows={3}
                          />
                        </div>
                      </div>

                      {/* Columna derecha: Mapa */}
                      <div>
                        {mostrarMapaResto ? (
                          <div className="h-full min-h-[300px]">
                            <MapaDireccionMapbox
                              key={`resto-${direccionSeleccionadaResto}-${coordenadasResto?.lat}-${coordenadasResto?.lng}`}
                              direccion={direccionResto || ''}
                              clienteNombre={clienteNombre}
                              onCoordenadaChange={handleCoordenadaChangeResto}
                              coordenadasIniciales={coordenadasResto}
                              editable={true}
                            />
                          </div>
                        ) : (
                          <div className="h-full min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                            <FaMapMarkedAlt size={32} className="text-gray-300" />
                            <span>{direccionResto ? 'Click en "Ver Mapa" para marcar ubicación' : 'Sin dirección'}</span>
                            {coordenadasResto && (
                              <span className="text-xs text-green-600 font-mono">
                                Ubicación guardada: {coordenadasResto.lat.toFixed(4)}, {coordenadasResto.lng.toFixed(4)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de calendario para seleccionar slot - Domicilio */}
      <ModalCalendarioSlot
        open={modalCalendarioDomicilio}
        onClose={() => setModalCalendarioDomicilio(false)}
        onAplicar={handleAplicarSlotDomicilio}
        chofer_id={despachadorId}
      />

      {/* Modal de calendario para seleccionar slot - Resto Parcial */}
      <ModalCalendarioSlot
        open={modalCalendarioResto}
        onClose={() => setModalCalendarioResto(false)}
        onAplicar={handleAplicarSlotResto}
        chofer_id={restoDespachadorId}
      />
    </Modal>
  )
}
