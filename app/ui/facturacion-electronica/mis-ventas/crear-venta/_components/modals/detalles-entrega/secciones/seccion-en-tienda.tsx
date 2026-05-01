'use client'

import { Form, Select } from 'antd'
import type { SeccionOcultable } from '../types'

interface SeccionEnTiendaProps {
  ocultar?: Set<SeccionOcultable>
}

/**
 * Sección EnTienda — la más simple del modal.
 * Solo pregunta "¿Quién entrega?" y se commitea via Form.Item.
 *
 * Antes era un Select controlado a mano (useWatch + setFieldValue) lo que
 * en algunos flujos dejaba el display con "Almacen" pero el form sin el
 * valor (o con uno viejo de un intento previo). Form.Item garantiza que
 * la unión form ↔ display sea automática.
 */
export function SeccionEnTienda({ ocultar }: SeccionEnTiendaProps) {
  if (ocultar?.has('quien-entrega')) return null
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        ¿Quién entrega? <span className="text-red-500">*</span>
      </label>
      <Form.Item
        name="quien_entrega"
        noStyle
        initialValue="almacen"
        rules={[{ required: true, message: 'Selecciona quién entrega' }]}
      >
        <Select
          placeholder="Seleccionar"
          options={[
            { value: 'almacen', label: 'Almacen' },
            { value: 'vendedor', label: 'Vendedor' },
          ]}
          className="w-full"
        />
      </Form.Item>
    </div>
  )
}
