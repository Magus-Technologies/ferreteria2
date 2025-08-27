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
    stock: `${addNegative ? '-' : ''}${
      unidadesCompletas != 0 ? unidadesCompletas : ''
    }F${fraccionFormateada != 0 ? fraccionFormateada : ''}`,
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
      {unidadesCompletas != 0 ? unidadesCompletas : ''}
      <span className={`text-orange-600 ${className}`}>F</span>
      {fraccionFormateada != 0 ? fraccionFormateada : ''}
    </>
  )
}
