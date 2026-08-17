// Identidad estable por fila de carrito (ventas y cotizaciones). Antes la
// daba Form.List (`field.key`); ahora que las tablas de productos viven en
// Zustand (no en Ant Design Form), cada fila necesita la suya propia para
// que AG Grid (getRowId) y las funciones de update/remove puedan
// identificarla sin ambigüedad — incluso dos filas del mismo producto_id
// (ej. dos instancias de paquete) tienen cada una la suya.
let rowIdCounter = 0
export function generarRowId(): string {
  rowIdCounter += 1
  return `row-${Date.now()}-${rowIdCounter}`
}
