'use client'

import { useEffect } from 'react'
import { Form, Select } from 'antd'
import type { SeccionOcultable } from '../types'

interface SeccionEnTiendaProps {
  ocultar?: Set<SeccionOcultable>
}

const OPCIONES_VALIDAS = ['almacen', 'vendedor'] as const

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
  const form = Form.useFormInstance()
  const quienEntrega = Form.useWatch('quien_entrega', form)

  // Salvaguarda: En Tienda SOLO admite 'almacen'/'vendedor'. Si el form trae
  // 'chofer' (heredado de una entrega a domicilio al editar la venta), el
  // Select mostraría "CHOFER" crudo. Esta sección es la dueña de la
  // restricción, así que normaliza el valor ella misma.
  useEffect(() => {
    if (quienEntrega && !OPCIONES_VALIDAS.includes(quienEntrega)) {
      form.setFieldValue('quien_entrega', 'almacen')
    }
  }, [quienEntrega, form])

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
