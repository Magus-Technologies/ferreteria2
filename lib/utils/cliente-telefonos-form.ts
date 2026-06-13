import type { FormInstance } from 'antd'

/**
 * Sistema de teléfonos tipados del cliente (Cel 1 / Cel 2), análogo al de
 * direcciones (D1..D4) pero minimal: dos slots fijos respaldados por las
 * columnas existentes `telefono` (C1) y `celular` (C2) — sin tabla nueva.
 *
 * Piezas:
 *  - `RadioTelefonoCliente` (componente)  → selector Cel 1 / Cel 2
 *  - `setTelefonosClienteToForm`          → carga ambos al seleccionar cliente
 *  - `clearTelefonosClienteFromForm`      → limpia al deseleccionar
 *
 * Para agregar C3 en el futuro: agregar a `TipoTelefono` + `TIPOS_TELEFONO_LIST`
 * + `TELEFONO_CLIENTE_FIELD` + `TELEFONO_FORM_HIDDEN` (y la columna en DB).
 */
export enum TipoTelefono {
  C1 = 'C1',
  C2 = 'C2',
}

export const TIPOS_TELEFONO_LIST: TipoTelefono[] = [TipoTelefono.C1, TipoTelefono.C2]

export const TELEFONO_LABEL: Record<TipoTelefono, string> = {
  [TipoTelefono.C1]: 'Cel 1',
  [TipoTelefono.C2]: 'Cel 2',
}

/** Columna del cliente que respalda cada slot. */
export const TELEFONO_CLIENTE_FIELD: Record<TipoTelefono, 'telefono' | 'celular'> = {
  [TipoTelefono.C1]: 'telefono',
  [TipoTelefono.C2]: 'celular',
}

/** Campo oculto del form donde se guarda el valor de cada slot. */
export const TELEFONO_FORM_HIDDEN: Record<TipoTelefono, string> = {
  [TipoTelefono.C1]: '_cliente_telefono_1',
  [TipoTelefono.C2]: '_cliente_telefono_2',
}

/**
 * Carga ambos teléfonos del cliente en los campos ocultos del form, deja
 * C1 como slot activo y copia su valor al campo visible `telefono`.
 */
export function setTelefonosClienteToForm(
  form: FormInstance,
  cliente: { telefono?: string | null; celular?: string | null },
) {
  form.setFieldValue(TELEFONO_FORM_HIDDEN[TipoTelefono.C1], cliente.telefono ?? '')
  form.setFieldValue(TELEFONO_FORM_HIDDEN[TipoTelefono.C2], cliente.celular ?? '')
  form.setFieldValue('telefono_seleccionado', TipoTelefono.C1)
  form.setFieldValue('telefono', cliente.telefono ?? '')
}

/** Limpia los campos de teléfono del form (al deseleccionar el cliente). */
export function clearTelefonosClienteFromForm(form: FormInstance) {
  form.setFieldValue(TELEFONO_FORM_HIDDEN[TipoTelefono.C1], '')
  form.setFieldValue(TELEFONO_FORM_HIDDEN[TipoTelefono.C2], '')
  form.setFieldValue('telefono_seleccionado', TipoTelefono.C1)
  form.setFieldValue('telefono', '')
}

/**
 * Reconstruye los valores finales de ambos teléfonos a partir del estado del
 * form. El campo visible `telefono` tiene el valor del slot activo (con las
 * ediciones inline); los ocultos tienen los slots inactivos.
 *
 * @returns `{ telefono, celular }` listos para sincronizar con el cliente.
 */
export function resolverTelefonosCliente(form: FormInstance): {
  telefono: string | null
  celular: string | null
} {
  const activo = (form.getFieldValue('telefono_seleccionado') as TipoTelefono) || TipoTelefono.C1
  const visible = (form.getFieldValue('telefono') as string | undefined)?.trim() || ''
  const ocultoC1 = (form.getFieldValue(TELEFONO_FORM_HIDDEN[TipoTelefono.C1]) as string | undefined)?.trim() || ''
  const ocultoC2 = (form.getFieldValue(TELEFONO_FORM_HIDDEN[TipoTelefono.C2]) as string | undefined)?.trim() || ''

  const c1 = activo === TipoTelefono.C1 ? visible : ocultoC1
  const c2 = activo === TipoTelefono.C2 ? visible : ocultoC2

  return {
    telefono: c1 || null,
    celular: c2 || null,
  }
}
