import { Prisma } from '@prisma/client'

export function manejoDeCosto({
  stock_actual,
  agregar,
  costo_nuevo,
}: {
  stock_actual: Prisma.Decimal
  agregar: boolean
  costo_nuevo: Prisma.Decimal
}) {
  let nuevo_costo: Prisma.Decimal | undefined = undefined
  if (stock_actual.toNumber() <= 0 && agregar) nuevo_costo = costo_nuevo

  return {
    nuevo_costo,
  }
}
