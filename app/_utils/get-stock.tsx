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
    unidades_contenidas != 0 ? Math.floor(stockTotal / unidades_contenidas) : 0
  const fraccionRestante =
    unidades_contenidas != 0 ? stockTotal % unidades_contenidas : stockTotal

  const fraccionFormateada =
    fraccionRestante % 1 === 0 ? fraccionRestante : fraccionRestante.toFixed(2)

  return {
    stock: `${
      unidadesCompletas != 0 ? unidadesCompletas : ''
    }F${fraccionFormateada}`,
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
  const { unidadesCompletas, fraccionFormateada } = getStock({
    stock_entero,
    stock_fraccion,
    unidades_contenidas,
  })

  return (
    <>
      {unidadesCompletas != 0 ? unidadesCompletas : ''}
      <span className={`text-orange-600 ${className}`}>F</span>
      {fraccionFormateada}
    </>
  )
}
