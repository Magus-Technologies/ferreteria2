import { Prisma } from '@prisma/client'

export function manejoDeCosto({
  stock_actual,
  nuevo_stock,
  agregar,
  costo_nuevo,
}: {
  stock_actual: Prisma.Decimal
  nuevo_stock: number
  agregar: boolean
  costo_nuevo: Prisma.Decimal
}) {
  console.log('🚀 ~ file: manejo-de-costo.ts:5 ~ stock_actual:', stock_actual)
  console.log('🚀 ~ file: manejo-de-costo.ts:15 ~ nuevo_stock:', nuevo_stock)
  console.log('🚀 ~ file: manejo-de-costo.ts:16 ~ agregar:', agregar)
  console.log('🚀 ~ file: manejo-de-costo.ts:17 ~ costo_nuevo:', costo_nuevo)
  if (!agregar && nuevo_stock < 0)
    throw new Error('El producto no tiene suficiente stock para quitar')

  let nuevo_costo: Prisma.Decimal | undefined = undefined
  if (stock_actual.toNumber() === 0) {
    if (agregar) nuevo_costo = costo_nuevo
    else
      throw new Error(
        'No se puede quitar stock a un producto que no tiene stock'
      )
  } else if (stock_actual.toNumber() < 0)
    throw new Error('El producto tiene stock negativo')

  if (!agregar && nuevo_stock === 0) nuevo_costo = Prisma.Decimal(0)
  console.log('🚀 ~ file: manejo-de-costo.ts:20 ~ nuevo_costo:', nuevo_costo)

  return {
    nuevo_costo,
  }
}
