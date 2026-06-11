/**
 * Utilidades centralizadas para sincronizar las direcciones de un cliente
 * (`cliente.direcciones[]`) con los campos legacy del form
 * (`_cliente_direccion_1`..`_cliente_direccion_4`, `direccion`, etc.).
 *
 * Antes este código estaba duplicado como `switch (dir.tipo) { case 'D1': ... }`
 * en ~6 archivos. Ahora vive en un solo lugar — agregar `D5` solo requiere
 * extender `TIPOS_DIRECCION_LIST` en `lib/api/cliente.ts` y agregar una
 * entrada al mapeo `LEGACY_CLIENTE_DIRECCION_FIELDS` debajo.
 */

import type { FormInstance } from 'antd'
import {
  TIPOS_DIRECCION_LIST,
  TipoDireccion,
  type Cliente,
  type DireccionCliente,
} from '~/lib/api/cliente'

/**
 * Nombre del campo legacy del form que guarda la dirección de cada tipo
 * cuando el cliente está SELECCIONADO desde un select (no editado). Útil
 * en formularios como `form-crear-venta`, `form-crear-cotizacion`,
 * `form-crear-guia`, etc., donde se preselecciona una dirección con un
 * radio/check `D1/D2/D3/D4`.
 */
export const LEGACY_CLIENTE_DIRECCION_FIELDS: Record<TipoDireccion, string> = {
  [TipoDireccion.D1]: '_cliente_direccion_1',
  [TipoDireccion.D2]: '_cliente_direccion_2',
  [TipoDireccion.D3]: '_cliente_direccion_3',
  [TipoDireccion.D4]: '_cliente_direccion_4',
}

export const LEGACY_CLIENTE_DIRECCION_ID_FIELDS: Record<TipoDireccion, string> = {
  [TipoDireccion.D1]: '_cliente_direccion_id_1',
  [TipoDireccion.D2]: '_cliente_direccion_id_2',
  [TipoDireccion.D3]: '_cliente_direccion_id_3',
  [TipoDireccion.D4]: '_cliente_direccion_id_4',
}

/**
 * Setea en el form los campos `_cliente_direccion_*` con las direcciones
 * del cliente. Hace `find(d => d.tipo === ...)` por cada tipo para que el
 * orden del array no importe.
 *
 * Si `cliente` es undefined, limpia todos los campos.
 */
export function setDireccionesClienteToForm(
  form: FormInstance,
  cliente?: Pick<Cliente, 'direcciones'> | null,
): void {
  const direcciones = cliente?.direcciones ?? []
  TIPOS_DIRECCION_LIST.forEach((tipo) => {
    const found = direcciones.find((d) => d.tipo === tipo)
    form.setFieldValue(LEGACY_CLIENTE_DIRECCION_FIELDS[tipo], found?.direccion ?? '')
    form.setFieldValue(LEGACY_CLIENTE_DIRECCION_ID_FIELDS[tipo], found?.id ?? null)
  })
}

/**
 * Limpia los 4 (o N) campos `_cliente_direccion_*` del form. Equivalente
 * a `setDireccionesClienteToForm(form)` pero más explícito en su intención.
 */
export function clearDireccionesClienteFromForm(form: FormInstance): void {
  TIPOS_DIRECCION_LIST.forEach((tipo) => {
    form.setFieldValue(LEGACY_CLIENTE_DIRECCION_FIELDS[tipo], '')
    form.setFieldValue(LEGACY_CLIENTE_DIRECCION_ID_FIELDS[tipo], null)
  })
}

export function getDireccionIdFromForm(form: FormInstance, tipo: TipoDireccion): number | null {
  return form.getFieldValue(LEGACY_CLIENTE_DIRECCION_ID_FIELDS[tipo]) ?? null
}

/**
 * Lee el campo legacy del form para el tipo dado. Útil cuando un radio/
 * checkbox cambia la `direccion_seleccionada` y hay que reflejar el valor
 * en `direccion` / `direccion_entrega` / `punto_llegada`.
 */
export function getDireccionFromForm(
  form: FormInstance,
  tipo: TipoDireccion,
): string {
  return form.getFieldValue(LEGACY_CLIENTE_DIRECCION_FIELDS[tipo]) || ''
}

/**
 * Tipo helper para los `interface FormX` que listaban los 4
 * `_cliente_direccion_1..4` campo por campo. Ahora se importa este tipo
 * y se "spread-extends" en el interface del form.
 *
 * @example
 *   interface FormCreateVenta extends ClienteDireccionFormFields {
 *     id: string
 *     ...
 *   }
 */
export type ClienteDireccionFormFields = {
  [K in TipoDireccion as `_cliente_direccion_${K extends `D${infer N}` ? N : never}`]?: string
} & {
  [K in TipoDireccion as `_cliente_direccion_id_${K extends `D${infer N}` ? N : never}`]?: number | null
}
