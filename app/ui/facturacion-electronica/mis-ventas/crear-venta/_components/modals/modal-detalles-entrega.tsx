'use client'

import { Select, Modal, FormInstance, Form } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { FaCalendar, FaMapMarkedAlt, FaUserEdit } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import SelectDespachadores from '~/app/_components/form/selects/select-despachadores'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import TitleForm from '~/components/form/title-form'
import dynamic from 'next/dynamic'
import useCreateVenta from '../../_hooks/use-create-venta'

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
  
  // Hook para crear venta
  const { handleSubmit: crearVenta, loading: creandoVenta } = useCreateVenta()

  const handleEditarCliente = () => {
    onEditarCliente()
  }

  // Callback para cuando el usuario marca una ubicación en el mapa
  const handleCoordenadaChange = useCallback((nuevasCoordenadas: Coordenadas) => {
    setCoordenadas(nuevasCoordenadas)
    // Guardar en el formulario
    form.setFieldValue('latitud', nuevasCoordenadas.lat)
    form.setFieldValue('longitud', nuevasCoordenadas.lng)
  }, [form])

  // ✅ Setear tipo_despacho en el formulario cuando se abre el modal
  useEffect(() => {
    if (open) {
      form.setFieldValue('tipo_despacho', tipoDespacho)
    }
  }, [open, tipoDespacho, form])

  const handleConfirmar = async () => {
    // Obtener todos los valores del formulario de venta
    const ventaValues = form.getFieldsValue()

    // Crear la venta
    await crearVenta(ventaValues)
    
    // Cerrar el modal después de crear la venta
    setOpen(false)
    
    // Llamar a onConfirmar si existe
    onConfirmar()
  }

  const getTipoDespachoLabel = () => {
    switch (tipoDespacho) {
      case 'EnTienda':
        return '🏪 Despacho en Tienda'
      case 'Domicilio':
        return '🚚 Despacho a Domicilio'
      case 'Parcial':
        return '📦 Despacho Parcial'
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
      width={800}
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
            disabled={creandoVenta}
          >
            {creandoVenta
              ? 'Procesando...'
              : tipoDespacho === 'EnTienda'
              ? 'Entregar Ahora'
              : tipoDespacho === 'Parcial'
              ? 'Entregar Parcial'
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
                { value: 'vendedor', label: '👤 Vendedor' },
                { value: 'almacen', label: '📦 Almacén' },
              ]}
              className="w-full"
            />
          </div>
        )}

        {/* Campos para Despacho a Domicilio */}
        {(tipoDespacho === 'Domicilio' || tipoDespacho === 'Parcial') && (
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
                        ✅ Ubicación guardada: {coordenadas.lat.toFixed(4)}, {coordenadas.lng.toFixed(4)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
