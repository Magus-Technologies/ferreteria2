'use client'

import { Form, Input, Select } from 'antd'
import { FormInstance } from 'antd/es/form'
import { useState } from 'react'
import SelectChoferes from '~/app/_components/form/selects/select-choferes'
import ButtonBase from '~/components/buttons/button-base'
import dynamic from 'next/dynamic'
import RadioDireccionCliente from '~/app/_components/form/radio-direccion-cliente'

// Importar el mapa dinámicamente
const MapaDireccion = dynamic(
  () => import('../maps/mapa-direccion'),
  { ssr: false }
)

interface FormDespachoDomicilioProps {
  form: FormInstance
  tipoDespacho: 'Domicilio' | 'Parcial'
  clienteNombre?: string
  clienteDirecciones?: {
    direccion?: string | null
    direccion_2?: string | null
    direccion_3?: string | null
    direccion_4?: string | null
  }
  direccionSeleccionada?: 'D1' | 'D2' | 'D3' | 'D4'
  onEditarCliente: () => void
}

export default function FormDespachoDomicilio({
  form,
  tipoDespacho,
  clienteNombre,
  clienteDirecciones,
  direccionSeleccionada,
  onEditarCliente,
}: FormDespachoDomicilioProps) {
  const [mostrarMapa, setMostrarMapa] = useState(false)

  return (
    <div className="space-y-4 border-t pt-4">
      {/* Campos ocultos para las direcciones del cliente */}
      <Form.Item name="_cliente_direccion_1" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="_cliente_direccion_2" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="_cliente_direccion_3" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="_cliente_direccion_4" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="direccion_seleccionada" hidden>
        <Input />
      </Form.Item>
      <Form.Item name="direccion" hidden>
        <Input />
      </Form.Item>
      {/* Chofer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Designar Chofer: <span className="text-red-500">*</span>
        </label>
        <SelectChoferes
          form={form}
          propsForm={{
            name: 'chofer_id',
          }}
          placeholder="Seleccionar chofer"
          className="w-full"
        />
      </div>

      {/* Fecha y Horarios */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha: <span className="text-red-500">*</span>
          </label>
          <Form.Item
            name="fecha_programada"
            className="mb-0"
            rules={[{ required: true, message: 'Seleccione fecha' }]}
          >
            <Input type="date" className="w-full" />
          </Form.Item>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hora Inicio: <span className="text-red-500">*</span>
          </label>
          <Form.Item
            name="hora_inicio"
            className="mb-0"
            rules={[{ required: true, message: 'Seleccione hora' }]}
          >
            <Select
              placeholder="Hora"
              options={[
                { value: '07:00', label: '07:00 AM' },
                { value: '08:00', label: '08:00 AM' },
                { value: '09:00', label: '09:00 AM' },
                { value: '10:00', label: '10:00 AM' },
                { value: '11:00', label: '11:00 AM' },
                { value: '12:00', label: '12:00 PM' },
                { value: '13:00', label: '01:00 PM' },
                { value: '14:00', label: '02:00 PM' },
                { value: '15:00', label: '03:00 PM' },
                { value: '16:00', label: '04:00 PM' },
                { value: '17:00', label: '05:00 PM' },
                { value: '18:00', label: '06:00 PM' },
              ]}
              className="w-full"
            />
          </Form.Item>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hora Fin: <span className="text-red-500">*</span>
          </label>
          <Form.Item
            name="hora_fin"
            className="mb-0"
            rules={[{ required: true, message: 'Seleccione hora' }]}
          >
            <Select
              placeholder="Hora"
              options={[
                { value: '08:00', label: '08:00 AM' },
                { value: '09:00', label: '09:00 AM' },
                { value: '10:00', label: '10:00 AM' },
                { value: '11:00', label: '11:00 AM' },
                { value: '12:00', label: '12:00 PM' },
                { value: '13:00', label: '01:00 PM' },
                { value: '14:00', label: '02:00 PM' },
                { value: '15:00', label: '03:00 PM' },
                { value: '16:00', label: '04:00 PM' },
                { value: '17:00', label: '05:00 PM' },
                { value: '18:00', label: '06:00 PM' },
                { value: '19:00', label: '07:00 PM' },
              ]}
              className="w-full"
            />
          </Form.Item>
        </div>
      </div>

      {/* Dirección y Mapa */}
      <div className="grid grid-cols-2 gap-4">
        {/* Columna Izquierda */}
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Dirección de Entrega: <span className="text-red-500">*</span>
              </label>
              <RadioDireccionCliente form={form} />
            </div>
            <Form.Item
              name="direccion_entrega"
              className="mb-0"
              rules={[
                {
                  required: true,
                  message: 'Ingrese la dirección',
                },
              ]}
            >
              <Input.TextArea placeholder="Dirección de entrega" rows={3} />
            </Form.Item>
          </div>

          <div className="flex gap-2">
            <ButtonBase
              color="info"
              size="sm"
              type="button"
              onClick={() => setMostrarMapa(!mostrarMapa)}
              className="flex-1"
            >
              {mostrarMapa ? 'Ocultar' : 'Ver'} Mapa
            </ButtonBase>
            <ButtonBase
              color="warning"
              size="sm"
              type="button"
              onClick={onEditarCliente}
              className="flex-1"
            >
              Editar Cliente
            </ButtonBase>
          </div>
        </div>

        {/* Columna Derecha: Mapa */}
        <div>
          {mostrarMapa && form.getFieldValue('direccion_entrega') ? (
            <div className="h-full min-h-[200px] rounded-lg overflow-hidden border border-gray-300">
              <MapaDireccion
                direccion={form.getFieldValue('direccion_entrega')}
                clienteNombre={clienteNombre}
              />
            </div>
          ) : (
            <div className="h-full min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 text-sm">
              {form.getFieldValue('direccion_entrega')
                ? 'Click en "Ver Mapa" para visualizar'
                : 'Sin dirección'}
            </div>
          )}
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Observaciones:
        </label>
        <Form.Item name="observaciones" className="mb-0">
          <Input.TextArea placeholder="Observaciones (opcional)" rows={2} />
        </Form.Item>
      </div>
    </div>
  )
}
