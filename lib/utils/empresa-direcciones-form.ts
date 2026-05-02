/**
 * Utilidades para usar las direcciones de la EMPRESA en formularios.
 *
 * A diferencia de las direcciones del cliente (`direcciones_cliente` con
 * enum `tipo` D1..D4), `direccion_empresa` usa `alias` libre y soporta N
 * direcciones. Para mantener una UX consistente con cliente, este módulo
 * trata las primeras N direcciones del array como `D1`, `D2`, ..., `DN`
 * por orden de inserción.
 *
 * Si el equipo decide migrar empresa al mismo enum tipado (D1..D4) en el
 * futuro, este módulo es el único punto a actualizar.
 */

import type { DireccionEmpresa } from '~/lib/api/empresa'

/**
 * Cantidad máxima de direcciones de empresa que el frontend muestra como
 * D1/D2/D3/D4 en selectores. Si se quiere soportar D5+, basta con subir
 * este número (y asegurar que el backend acepta más).
 */
export const MAX_DIRECCIONES_EMPRESA = 4

/**
 * Tipo derivado del orden — `'D1'`, `'D2'`, ... hasta `MAX_DIRECCIONES_EMPRESA`.
 * Usar este alias en lugar de `'D1' | 'D2' | 'D3' | 'D4'` literal.
 */
export type TipoDireccionEmpresa = 'D1' | 'D2' | 'D3' | 'D4'

export const TIPOS_DIRECCION_EMPRESA: TipoDireccionEmpresa[] = [
  'D1',
  'D2',
  'D3',
  'D4',
]

/**
 * Estructura unificada que usa el componente `<RadioDireccionEmpresa>` y
 * cualquier consumidor del frontend. Mapea cada slot D1..DN a la
 * `DireccionEmpresa` real del backend (o `null` si no existe).
 */
export interface SlotDireccionEmpresa {
  tipo: TipoDireccionEmpresa
  /** Índice en el array original (0..N-1) o `undefined` si el slot está vacío. */
  index: number | undefined
  /** Dirección real del backend, o `null` si el slot está vacío. */
  direccion: DireccionEmpresa | null
}

/**
 * Convierte el array de `DireccionEmpresa[]` (raw del backend) en
 * exactamente `MAX_DIRECCIONES_EMPRESA` slots — los slots que excedan el
 * largo del array quedan con `direccion: null`. Iterar sobre el resultado
 * garantiza N slots fijos para tabs/radios.
 *
 * **Orden:** la dirección con `es_principal === true` siempre va en `D1`.
 * Las secundarias se distribuyen en `D2..DN` por orden de inserción. Esto
 * asegura UX consistente: el "punto de partida" sugerido por defecto es
 * la dirección principal de la empresa, no la primera del array que
 * podría ser una sucursal.
 */
export function buildSlotsDireccionEmpresa(
  direcciones: DireccionEmpresa[] | undefined | null,
): SlotDireccionEmpresa[] {
  const list = direcciones ?? []
  const principal = list.find((d) => d.es_principal) ?? null
  const secundarias = list.filter((d) => !d.es_principal)
  const ordenadas: (DireccionEmpresa | null)[] = [principal, ...secundarias]
  return TIPOS_DIRECCION_EMPRESA.map((tipo, index) => ({
    tipo,
    index: ordenadas[index] ? index : undefined,
    direccion: ordenadas[index] ?? null,
  }))
}

/**
 * Devuelve la `direccion` (string) del slot dado, o cadena vacía si el
 * slot está vacío. Útil al asignar el valor a un `Form.Item`.
 */
export function getDireccionEmpresaPorTipo(
  direcciones: DireccionEmpresa[] | undefined | null,
  tipo: TipoDireccionEmpresa,
): string {
  const slot = buildSlotsDireccionEmpresa(direcciones).find((s) => s.tipo === tipo)
  return slot?.direccion?.direccion ?? ''
}
