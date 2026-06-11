'use client'

import { Form, Input } from 'antd'
import {
  TIPOS_DIRECCION_LIST,
  type TipoDireccion,
} from '~/lib/api/cliente'
import { LEGACY_CLIENTE_DIRECCION_FIELDS, LEGACY_CLIENTE_DIRECCION_ID_FIELDS } from '~/lib/utils/cliente-direcciones-form'

/**
 * Renderiza los `Form.Item` ocultos `_cliente_direccion_1..4` (o N) que
 * usan los formularios de venta/cotización/guía/despacho para guardar las
 * direcciones del cliente seleccionado.
 *
 * Antes cada formulario duplicaba 4 `Form.Item` hardcoded — agregar `D5`
 * implicaba cambiar 4 archivos. Ahora basta con extender
 * `TIPOS_DIRECCION_LIST` en `lib/api/cliente.ts` y este componente
 * renderiza el `Form.Item` extra automáticamente.
 */
export default function HiddenDireccionesFormItems() {
  return (
    <>
      {TIPOS_DIRECCION_LIST.map((tipo: TipoDireccion) => (
        <Form.Item key={tipo} name={LEGACY_CLIENTE_DIRECCION_FIELDS[tipo]} hidden>
          <Input type="hidden" />
        </Form.Item>
      ))}
      {TIPOS_DIRECCION_LIST.map((tipo: TipoDireccion) => (
        <Form.Item key={`id-${tipo}`} name={LEGACY_CLIENTE_DIRECCION_ID_FIELDS[tipo]} hidden>
          <Input type="hidden" />
        </Form.Item>
      ))}
    </>
  )
}
