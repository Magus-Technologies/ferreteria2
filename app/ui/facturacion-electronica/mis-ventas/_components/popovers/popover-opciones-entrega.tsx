'use client'

import { Select, Popover, FormInstance } from 'antd'
import { useState, ReactNode } from 'react'
import DatePickerBase from '~/app/_components/form/fechas/date-picker-base'
import { FaCalendar, FaMapMarkedAlt, FaUserEdit } from 'react-icons/fa'
import ButtonBase from '~/components/buttons/button-base'
import SelectChoferes from '~/app/_components/form/selects/select-choferes'
import TextareaBase from '~/app/_components/form/inputs/textarea-base'
import dynamic from 'next/dynamic'

// Importar el mapa dinámicamente para evitar problemas de SSR
const MapaDireccion = dynamic(
  () => import('../maps/mapa-direccion'),
  { ssr: false }
)

interface PopoverOpcionesEntregaProps {
  children: ReactNode
  form: FormInstance
  tipoDespacho: 'EnTienda' | 'Domicilio' | 'Parcial'
  setTipoDespacho: (tipo: 'EnTienda' | 'Domicilio' | 'Parcial') => void
  onConfirmar: () => void
  onEditarCliente: () => void
  direccion?: string
  clienteNombre?: string
  loading?: boolean
}

export default function PopoverOpcionesEntrega({
  children,
  form,
  tipoDespacho,
  setTipoDespacho,
  onConfirmar,
  onEditarCliente,
  direccion,
  clienteNombre,
  loading,
}: PopoverOpcionesEntregaProps) {
  const [open, setOpen] = useState(false)
  const [mostrarMapa, setMostrarMapa] = useState(false)

  const handleEditarCliente = () => {
    setOpen(false) // Cerrar el popover primero
    onEditarCliente() // Luego abrir el modal
  }

  const content = (
    <div className="w-[700px] max-h-[85vh] overflow-y-auto overflow-x-hidden space-y-2">
      {/* Selector de Tipo de Despacho */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Tipo de Despacho:
        </label>
        <Select
          value={tipoDespacho}
          onChange={(value) => setTipoDespacho(value)}
          className="w-full"
          size="small"
          options={[
            {
              value: 'EnTienda',
              label: '🏪 Despacho en Tienda (Inmediato)',
            },
            {
              value: 'Domicilio',
              label: '🚚 Despacho a Domicilio (Programar)',
            },
            {
              value: 'Parcial',
              label: '📦 Despacho Parcial (Parte ahora, parte después)',
            },
          ]}
        />
      </div>

      {/* Campos para Despacho en Tienda */}
      {tipoDespacho === 'EnTienda' && (
        <div className="space-y-2 border-t pt-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ¿Quién entrega? <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="Seleccionar"
              size="small"
              value={form.getFieldValue('quien_entrega')}
              onChange={(value) => form.setFieldValue('quien_entrega', value)}
              options={[
                { value: 'vendedor', label: '👤 Vendedor' },
                { value: 'almacen', label: '📦 Almacén' },
              ]}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Campos para Despacho a Domicilio */}
      {(tipoDespacho === 'Domicilio' || tipoDespacho === 'Parcial') && (
        <div className="space-y-2 border-t pt-2">
          {/* Fila 1: Chofer y Fecha */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Designar Chofer: <span className="text-red-500">*</span>
              </label>
              <SelectChoferes
                propsForm={{
                  name: 'chofer_id',
                  rules: [
                    {
                      required: true,
                      message: 'Por favor, selecciona un chofer',
                    },
                  ],
                }}
                placeholder="Seleccionar chofer"
                className="w-full"
                size="small"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Fecha: <span className="text-red-500">*</span>
              </label>
              <DatePickerBase
                propsForm={{
                  name: 'fecha_programada',
                }}
                placeholder="Fecha"
                prefix={
                  <FaCalendar size={12} className="text-blue-600 mx-1" />
                }
                className="w-full"
                size="small"
              />
            </div>
          </div>

          {/* Fila 2: Horarios */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hora Inicio:
              </label>
              <Select
                placeholder="Hora"
                size="small"
                value={form.getFieldValue('hora_inicio')}
                onChange={(value) => form.setFieldValue('hora_inicio', value)}
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
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Hora Fin:
              </label>
              <Select
                placeholder="Hora"
                size="small"
                value={form.getFieldValue('hora_fin')}
                onChange={(value) => form.setFieldValue('hora_fin', value)}
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

          {/* Fila 3: Dirección y Mapa en dos columnas */}
          <div className="grid grid-cols-2 gap-2">
            {/* Columna izquierda: Dirección y botones */}
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dirección: <span className="text-red-500">*</span>
                </label>
                <TextareaBase
                  propsForm={{
                    name: 'direccion_entrega',
                  }}
                  placeholder="Dirección de entrega"
                  rows={3}
                  size="small"
                />
              </div>

              <div className="flex gap-2">
                <ButtonBase
                  color="info"
                  size="sm"
                  type="button"
                  className="flex items-center gap-1 text-xs flex-1"
                  onClick={() => setMostrarMapa(!mostrarMapa)}
                >
                  <FaMapMarkedAlt size={12} />
                  {mostrarMapa ? 'Ocultar' : 'Ver'} Mapa
                </ButtonBase>

                <ButtonBase
                  color="warning"
                  size="sm"
                  type="button"
                  className="flex items-center gap-1 text-xs flex-1"
                  onClick={handleEditarCliente}
                >
                  <FaUserEdit size={12} />
                  Editar Cliente
                </ButtonBase>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observaciones:
                </label>
                <TextareaBase
                  propsForm={{
                    name: 'observaciones',
                  }}
                  placeholder="Observaciones (opcional)"
                  rows={3}
                  size="small"
                />
              </div>
            </div>

            {/* Columna derecha: Mapa */}
            <div>
              {mostrarMapa && direccion ? (
                <div className="h-full min-h-[250px]">
                  <MapaDireccion
                    direccion={direccion}
                    clienteNombre={clienteNombre}
                  />
                </div>
              ) : (
                <div className="h-full min-h-[250px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                  {direccion ? 'Click en "Ver Mapa" para visualizar' : 'Sin dirección'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end gap-2 border-t pt-2 mt-2">
        <ButtonBase
          color="default"
          size="sm"
          type="button"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </ButtonBase>
        <ButtonBase
          color="success"
          size="sm"
          type="button"
          onClick={() => {
            onConfirmar()
            setOpen(false)
          }}
          disabled={loading}
        >
          {loading
            ? 'Procesando...'
            : tipoDespacho === 'EnTienda'
            ? 'Entregar Ahora'
            : tipoDespacho === 'Parcial'
            ? 'Entregar Parcial'
            : 'Programar Entrega'}
        </ButtonBase>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      title="Opciones de Entrega"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="top"
      overlayStyle={{ maxWidth: '750px' }}
    >
      {children}
    </Popover>
  )
}
