/**
 * Parsea "14F0.15" o "10" o "10.5" a número de unidades derivadas.
 * "14F0.15" con factor=4 → 14 + 0.15/4 = 14.0375
 */
export function parseCantidadFraccion(input: string, factor: number): number | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  const fIndex = trimmed.toUpperCase().indexOf('F')
  if (fIndex !== -1) {
    const parteEntera = parseFloat(trimmed.slice(0, fIndex) || '0')
    const parteFraccion = parseFloat(trimmed.slice(fIndex + 1) || '0')
    if (isNaN(parteEntera) || isNaN(parteFraccion)) return null
    if (!factor || factor === 0) return parteEntera
    return parteEntera + parteFraccion / factor
  }

  const num = parseFloat(trimmed)
  return isNaN(num) ? null : num
}

/**
 * Formatea unidades derivadas a "XFY" si hay fracción, o número plano si no.
 * 14.0375 con factor=4 → "14F0.15"
 * 10 con factor=4 → "10"
 */
export function formatCantidadFraccion(value: number, factor: number): string {
  if (!factor || factor <= 0) return String(value)
  const enteras = Math.trunc(value)
  const fraccionBruta = Math.round((value - enteras) * factor * 1000) / 1000
  if (fraccionBruta <= 0) return String(enteras)
  const fraccionFormateada =
    fraccionBruta % 1 === 0
      ? String(fraccionBruta)
      : fraccionBruta.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return `${enteras}F${fraccionFormateada}`
}

/**
 * Formatea una cantidad para MOSTRARLA en el input de venta: decimal plano,
 * sin ceros de relleno y sin notación "XFY".
 *   2.5     → "2.5"
 *   2       → "2"
 *   14.0375 → "14.038"
 *
 * El input escribía lo tipeado con `formatCantidadFraccion`, así que una media
 * medida como 2.5 se transformaba sola en "2F0.5" y confundía al vendedor.
 * La notación F sigue aceptándose al ESCRIBIR (ver `parseCantidadFraccion`);
 * lo que cambia es cómo se muestra. Se redondea a 3 decimales porque esa es la
 * precisión que guarda la DB (`unidadderivadainmutableventa.cantidad` decimal(9,3)).
 */
export function formatCantidadPlana(value: number): string {
  if (!Number.isFinite(value)) return ''
  return String(Math.round(value * 1000) / 1000)
}

export function getStock({
  stock_entero = 0,
  stock_fraccion,
  unidades_contenidas,
}: {
  stock_entero?: number
  stock_fraccion: number
  unidades_contenidas: number
}) {
  const stockTotal =
    stock_entero * (unidades_contenidas != 0 ? unidades_contenidas : 1) +
    stock_fraccion
  const unidadesCompletas =
    unidades_contenidas != 0 ? Math.trunc(stockTotal / unidades_contenidas) : 0

  const preFraccionRestante =
    unidades_contenidas != 0 ? stockTotal % unidades_contenidas : stockTotal
  const addNegative = preFraccionRestante < 0 && unidadesCompletas == 0
  const fraccionRestante = Math.abs(preFraccionRestante)

  const fraccionFormateada =
    fraccionRestante % 1 === 0 ? fraccionRestante : fraccionRestante.toFixed(2)

  return {
    stock: `${addNegative ? '-' : ''}${unidadesCompletas}F${
      fraccionFormateada != 0 ? fraccionFormateada : ''
    }`,
    addNegative,
    unidadesCompletas,
    fraccionFormateada,
  }
}

export function GetStock({
  stock_entero = 0,
  stock_fraccion,
  unidades_contenidas,
  className = '',
}: {
  stock_entero?: number
  stock_fraccion: number
  unidades_contenidas: number
  className?: string
}) {
  const { unidadesCompletas, fraccionFormateada, addNegative } = getStock({
    stock_entero,
    stock_fraccion,
    unidades_contenidas,
  })

  return (
    <>
      {addNegative ? '-' : ''}
      {unidadesCompletas}
      <span className={`text-orange-600 ${className}`}>F</span>
      {fraccionFormateada != 0 ? fraccionFormateada : ''}
    </>
  )
}
