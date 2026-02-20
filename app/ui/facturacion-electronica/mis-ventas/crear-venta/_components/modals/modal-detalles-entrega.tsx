'use client'

import { Select, Modal, FormInstance, Form, Input, Switch } from 'antd'
import { useState, useEffect, useCallback, useMemo } from 'react'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { FaCalendar, FaMapMarkedAlt, FaUserEdit } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import SelectDespachadores from '~/app/_components/form/selects/select-despachadores'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import TitleForm from '~/components/form/title-form'
import dynamic from 'next/dynamic'
import useCreateVenta from '../../_hooks/use-create-venta'
import type { FormCreateVenta } from '../others/body-vender'
import TablaProductosEntrega from '../../../_components/tables/tabla-productos-entrega'
import type { ProductoEntrega } from '../../../_hooks/use-productos-entrega'
import dayjs from 'dayjs'

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
  tipoDespacho: 'EnTienda' | 'Domicilio' | 'Parcial'
  onConfirmar: () => void
  onEditarCliente: () => void
  direccion?: string
  clienteNombre?: string
}

export default function ModalDetallesEntrega({
  open,
  setOpen,
  form,
  tipoDespacho,
  onConfirmar,
  onEditarCliente,
  direccion,
  clienteNombre,
}: ModalDetallesEntregaProps) {
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(null)
  const [productosEntrega, setProductosEntrega] = useState<ProductoEntrega[]>([])
  const [quienEntregaParcial, setQuienEntregaParcial] = useState<'almacen' | 'chofer'>('almacen')
  // Estado para programar el resto del parcial
  const [programarResto, setProgramarResto] = useState(false)
  const [horaInicioResto, setHoraInicioResto] = useState<string | undefined>(undefined)
  const [horaFinResto, setHoraFinResto] = useState<string | undefined>(undefined)
  const [direccionResto, setDireccionResto] = useState<string>('')
  const [observacionesResto, setObservacionesResto] = useState<string>('')

  // Hook para crear venta
  const { handleSubmit: crearVenta, loading: creandoVenta } = useCreateVenta()

  // Obtener productos del formulario
  const productos = Form.useWatch('productos', form) as FormCreateVenta['productos']

  // Inicializar cantidades de entrega cuando se abre el modal en modo Parcial
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

  // Callback para cuando el usuario marca una ubicación en el mapa
  const handleCoordenadaChange = useCallback((nuevasCoordenadas: Coordenadas) => {
    setCoordenadas(nuevasCoordenadas)
    form.setFieldValue('latitud', nuevasCoordenadas.lat)
    form.setFieldValue('longitud', nuevasCoordenadas.lng)
  }, [form])

  // Setear tipo_despacho en el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      form.setFieldValue('tipo_despacho', tipoDespacho)
    }
  }, [open, tipoDespacho, form])

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
        ventaValues.parcial_resto_programado = {
          despachador_id: restoDespachadorId,
          fecha_programada: restoFechaProgramada
            ? dayjs(restoFechaProgramada).format('YYYY-MM-DD')
            : undefined,
          hora_inicio: horaInicioResto,
          hora_fin: horaFinResto,
          direccion_entrega: direccionResto,
          observaciones: observacionesResto,
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
      width={tipoDespacho === 'Parcial' ? 900 : 800}
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
          <ButtonBase
            color="success"
            size="md"
            onClick={handleConfirmar}
            disabled={creandoVenta || (tipoDespacho === 'Parcial' && totalAEntregar === 0)}
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
              value={form.getFieldValue('quien_entrega')}
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
            {/* Fila 1: Chofer y Fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Designar Despachador: <span className="text-red-500">*</span>
                </label>
                <SelectDespachadores
                  form={form}
                  propsForm={{
                    name: 'despachador_id',
                    rules: [
                      {
                        required: true,
                        message: 'Por favor, selecciona un despachador',
                      },
                    ],
                  }}
                  placeholder="Seleccionar despachador"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha: <span className="text-red-500">*</span>
                </label>
                <DatePickerBase
                  propsForm={{
                    name: 'fecha_programada',
                  }}
                  placeholder="Fecha"
                  prefix={
                    <FaCalendar size={14} className="text-blue-600 mx-1" />
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Fila 2: Horarios */}
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="hora_inicio" className="mb-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Inicio:
                  </label>
                  <Select
                    placeholder="Hora"
                    options={[
                      { value: '08:00', label: '08:00' },
                      { value: '09:00', label: '09:00' },
                      { value: '10:00', label: '10:00' },
                      { value: '11:00', label: '11:00' },
                      { value: '12:00', label: '12:00' },
                      { value: '13:00', label: '13:00' },
                      { value: '14:00', label: '14:00' },
                      { value: '15:00', label: '15:00' },
                      { value: '16:00', label: '16:00' },
                      { value: '17:00', label: '17:00' },
                      { value: '18:00', label: '18:00' },
                    ]}
                    className="w-full"
                  />
                </div>
              </Form.Item>
              <Form.Item name="hora_fin" className="mb-0">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Fin:
                  </label>
                  <Select
                    placeholder="Hora"
                    options={[
                      { value: '09:00', label: '09:00' },
                      { value: '10:00', label: '10:00' },
                      { value: '11:00', label: '11:00' },
                      { value: '12:00', label: '12:00' },
                      { value: '13:00', label: '13:00' },
                      { value: '14:00', label: '14:00' },
                      { value: '15:00', label: '15:00' },
                      { value: '16:00', label: '16:00' },
                      { value: '17:00', label: '17:00' },
                      { value: '18:00', label: '18:00' },
                      { value: '19:00', label: '19:00' },
                    ]}
                    className="w-full"
                  />
                </div>
              </Form.Item>
            </div>

            {/* Fila 3: Dirección y Mapa en dos columnas */}
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
                    placeholder="Dirección de entrega"
                    rows={3}
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
                      direccion={direccion || ''}
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
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <p className="text-sm text-blue-700 font-medium">
                    📦 Configurar entrega programada para los{' '}
                    {productosEntrega.reduce((acc, p) => acc + (p.total - p.entregar), 0)} producto(s) restante(s)
                  </p>

                  {/* Despachador y Fecha */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Despachador: <span className="text-red-500">*</span>
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
                        Fecha programada: <span className="text-red-500">*</span>
                      </label>
                      <DatePickerBase
                        propsForm={{ name: '_resto_fecha_programada' }}
                        placeholder="Fecha"
                        prefix={<FaCalendar size={14} className="text-blue-600 mx-1" />}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Horarios */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora Inicio:
                      </label>
                      <Select
                        value={horaInicioResto}
                        onChange={setHoraInicioResto}
                        placeholder="Hora inicio"
                        options={[
                          { value: '08:00', label: '08:00' },
                          { value: '09:00', label: '09:00' },
                          { value: '10:00', label: '10:00' },
                          { value: '11:00', label: '11:00' },
                          { value: '12:00', label: '12:00' },
                          { value: '13:00', label: '13:00' },
                          { value: '14:00', label: '14:00' },
                          { value: '15:00', label: '15:00' },
                          { value: '16:00', label: '16:00' },
                          { value: '17:00', label: '17:00' },
                          { value: '18:00', label: '18:00' },
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora Fin:
                      </label>
                      <Select
                        value={horaFinResto}
                        onChange={setHoraFinResto}
                        placeholder="Hora fin"
                        options={[
                          { value: '09:00', label: '09:00' },
                          { value: '10:00', label: '10:00' },
                          { value: '11:00', label: '11:00' },
                          { value: '12:00', label: '12:00' },
                          { value: '13:00', label: '13:00' },
                          { value: '14:00', label: '14:00' },
                          { value: '15:00', label: '15:00' },
                          { value: '16:00', label: '16:00' },
                          { value: '17:00', label: '17:00' },
                          { value: '18:00', label: '18:00' },
                          { value: '19:00', label: '19:00' },
                        ]}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección de entrega:
                    </label>
                    <Input.TextArea
                      value={direccionResto}
                      onChange={(e) => setDireccionResto(e.target.value)}
                      placeholder="Dirección de entrega del resto"
                      rows={2}
                    />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observaciones:
                    </label>
                    <Input.TextArea
                      value={observacionesResto}
                      onChange={(e) => setObservacionesResto(e.target.value)}
                      placeholder="Observaciones (opcional)"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
