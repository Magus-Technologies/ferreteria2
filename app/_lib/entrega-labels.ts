/**
 * Labels centralizados para enums de entregas y ventas.
 *
 * Antes estaban duplicados en cada modal/componente que mostraba estos
 * valores (con variantes "Recojo en Tienda" vs "Recojo Tienda", con/sin
 * emoji, etc.). Ahora viven aquí — se importan donde se necesitan.
 *
 * Para opciones de Select, hay un helper `optionsFromMap` al final.
 */

// ============================================================
// Tipo de entrega — usado en EntregaProducto.tipo_entrega
// ============================================================
export const TIPO_ENTREGA_LABEL = {
  rt: 'Recojo en Tienda',
  de: 'Despacho a Domicilio',
  pa: 'Parcial',
} as const

export const TIPO_ENTREGA_ICON = {
  rt: '🏪',
  de: '🏠',
  pa: '🔀',
} as const

// Versión con emoji para tags/badges. Ej: "🏪 Recojo en Tienda"
export const TIPO_ENTREGA_LABEL_CON_ICON: Record<string, string> = {
  rt: `${TIPO_ENTREGA_ICON.rt} ${TIPO_ENTREGA_LABEL.rt}`,
  de: `${TIPO_ENTREGA_ICON.de} ${TIPO_ENTREGA_LABEL.de}`,
  pa: `${TIPO_ENTREGA_ICON.pa} ${TIPO_ENTREGA_LABEL.pa}`,
}

// ============================================================
// Tipo de despacho — usado en EntregaProducto.tipo_despacho
// ============================================================
export const TIPO_DESPACHO_LABEL = {
  in: 'Inmediato',
  pr: 'Programado',
} as const

export const TIPO_DESPACHO_ICON = {
  in: '⚡',
  pr: '📅',
} as const

export const TIPO_DESPACHO_LABEL_CON_ICON: Record<string, string> = {
  in: `${TIPO_DESPACHO_ICON.in} ${TIPO_DESPACHO_LABEL.in}`,
  pr: `${TIPO_DESPACHO_ICON.pr} ${TIPO_DESPACHO_LABEL.pr}`,
}

// ============================================================
// Tipo de despacho de la VENTA — usado en Venta.tipo_despacho
// (et=En Tienda, do=Domicilio, pa=Parcial). NO confundir con
// EntregaProducto.tipo_despacho que es in/pr.
// ============================================================
export const TIPO_DESPACHO_VENTA_LABEL = {
  et: 'Despacho en Tienda',
  do: 'Despacho a Domicilio',
  pa: 'Parcial',
} as const

export const TIPO_DESPACHO_VENTA_ICON = {
  et: '🏪',
  do: '🏠',
  pa: '🔀',
} as const

// ============================================================
// Estado de entrega
// ============================================================
export const ESTADO_ENTREGA_LABEL = {
  pe: 'Pendiente',
  ec: 'En Camino',
  en: 'Entregado',
  ca: 'Cancelado',
} as const

export const ESTADO_ENTREGA_COLOR = {
  pe: 'orange',
  ec: 'blue',
  en: 'green',
  ca: 'red',
} as const

// Iconos usados en filtros (distintos a los iconos visuales del historial).
export const ESTADO_ENTREGA_ICON_FILTER = {
  pe: '⏳',
  ec: '🚚',
  en: '✅',
  ca: '❌',
} as const

export const ESTADO_ENTREGA_LABEL_FILTER: Record<string, string> = {
  pe: `${ESTADO_ENTREGA_ICON_FILTER.pe} ${ESTADO_ENTREGA_LABEL.pe}`,
  ec: `${ESTADO_ENTREGA_ICON_FILTER.ec} ${ESTADO_ENTREGA_LABEL.ec}`,
  en: `${ESTADO_ENTREGA_ICON_FILTER.en} ${ESTADO_ENTREGA_LABEL.en}`,
  ca: `${ESTADO_ENTREGA_ICON_FILTER.ca} ${ESTADO_ENTREGA_LABEL.ca}`,
}

// ============================================================
// Quién entrega — usado en EntregaProducto.quien_entrega
// ============================================================
// Tipado como Record<string,string> porque suele indexarse con `entrega.quien_entrega`
// (any/string) — `as const` daba errores TS al usar la key dinámica.
export const QUIEN_ENTREGA_LABEL: Record<string, string> = {
  almacen: 'Almacén',
  vendedor: 'Vendedor',
  chofer: 'Chofer',
}

export const QUIEN_ENTREGA_ICON: Record<string, string> = {
  almacen: '📦',
  vendedor: '👤',
  chofer: '🚚',
}

// ============================================================
// Tipo de pedido — usado en EntregaProducto.tipo_pedido
// ============================================================
export const TIPO_PEDIDO_LABEL: Record<string, string> = {
  interno: 'Interno',
  externo: 'Externo',
}

// ============================================================
// Helpers
// ============================================================

/**
 * Convierte un mapa { value: label } a opciones de Ant Design Select.
 * Ej: optionsFromMap(TIPO_ENTREGA_LABEL_CON_ICON)
 */
export function optionsFromMap(
  map: Record<string, string>
): Array<{ value: string; label: string }> {
  return Object.entries(map).map(([value, label]) => ({ value, label }))
}
