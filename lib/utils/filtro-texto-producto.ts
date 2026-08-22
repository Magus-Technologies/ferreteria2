/**
 * Búsqueda de productos por texto — criterio ÚNICO para el front.
 *
 * Lo usan las tablas de kardex (inventario, facturación y combinado) y el modal
 * de búsqueda de productos. El espejo del lado servidor es
 * `ProductoRepository::applyFilters()` (filtro `search`), que es quien decide si
 * un Enter en el buscador selecciona directo o abre el modal. Si se toca uno
 * hay que tocar el otro.
 *
 * Por qué existe: antes se buscaba la frase completa como substring
 * (`TUBO PVC DSG"` no encontraba `TUBO PVC DSG 4" X 3M` por el " 4" del medio) y,
 * en los kardex, con el filtro rápido genérico de AG Grid, que mira TODAS las
 * columnas (un "4" suelto traía filas por la hora o el número de documento).
 *
 * Reglas:
 * - Sin acentos ni mayúsculas/minúsculas. Comillas y comas en los bordes de
 *   cada palabra se ignoran: `4"` y `4` encuentran lo mismo.
 * - Todas las palabras tienen que coincidir (AND), en cualquier orden.
 * - En el NOMBRE la palabra tiene que estar al INICIO de una palabra (inicio
 *   del texto o después de espacio, /, -, paréntesis, etc.): "TUBO" no debe
 *   traer "EUROTUBO". Y es prefijo: "TUB" sí encuentra "TUBO".
 * - En el CÓDIGO basta con que esté contenida (el kardex, que solo tiene el
 *   código del producto, usa prefijo para que un "4" suelto no traiga 17348).
 */
const normalizar = (valor: unknown): string =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function palabrasBusqueda(texto: string | undefined | null): string[] {
  return normalizar(texto)
    .split(/\s+/)
    .map((w) => w.replace(/^["',;]+|["',;]+$/g, ''))
    .filter(Boolean)
}

/** ¿`palabra` (ya normalizada) aparece al inicio de alguna palabra de `texto`? */
export function coincideInicioDePalabra(texto: unknown, palabra: string): boolean {
  if (!palabra) return true
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaparRegex(palabra)}`, 'u').test(normalizar(texto))
}

/** Filtro de las tablas de kardex: solo mira el producto de la fila. */
export function coincideProducto(
  fila: { producto_nombre?: unknown; producto_codigo?: unknown },
  palabras: string[],
): boolean {
  if (palabras.length === 0) return true
  const codigo = normalizar(fila.producto_codigo)
  return palabras.every((p) => coincideInicioDePalabra(fila.producto_nombre, p) || codigo.startsWith(p))
}

/** Filtro del modal de búsqueda: nombre / nombre de ticket / códigos. */
export function coincideProductoBusqueda(
  p: { name?: string | null; name_ticket?: string | null; cod_producto?: string | null; cod_barra?: string | null },
  palabras: string[],
): boolean {
  if (palabras.length === 0) return true
  const codigos = [p.cod_producto, p.cod_barra].map(normalizar)
  return palabras.every(
    (w) =>
      coincideInicioDePalabra(p.name, w) ||
      coincideInicioDePalabra(p.name_ticket, w) ||
      codigos.some((c) => c.includes(w)),
  )
}
