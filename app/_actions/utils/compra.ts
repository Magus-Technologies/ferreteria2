import { Prisma, TipoMoneda } from '@prisma/client'

export function getTotalCompra({
  compra,
}: {
  compra: Prisma.CompraGetPayload<{
    include: {
      productos_por_almacen: {
        include: {
          unidades_derivadas: true
        }
      }
    }
  }>
}) {
  let total = 0
  for (const item of compra.productos_por_almacen) {
    const costo = Number(item.costo ?? 0)
    for (const u of item.unidades_derivadas) {
      const cantidad = Number(u.cantidad ?? 0)
      const factor = Number(u.factor ?? 0)
      const flete = Number(u.flete ?? 0)
      const bonificacion = Boolean(u.bonificacion)
      const montoLinea = (bonificacion ? 0 : costo * cantidad * factor) + flete
      total += montoLinea
    }
  }

  const totalConPercepcion = total + Number(compra.percepcion ?? 0)

  const totalSoles =
    compra.tipo_moneda === TipoMoneda.Soles
      ? totalConPercepcion
      : totalConPercepcion * Number(compra.tipo_de_cambio ?? 1)

  return totalSoles
}
