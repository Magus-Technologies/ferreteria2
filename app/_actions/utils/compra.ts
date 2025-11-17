import { EstadoDeCompra, FormaDePago, Prisma, TipoMoneda } from '@prisma/client'

type CompraParaCalculo = Prisma.CompraGetPayload<{
  include: {
    productos_por_almacen: {
      include: {
        unidades_derivadas: true
      }
    }
  }
}>

export function getTotalCompra({ compra }: { compra: CompraParaCalculo }) {
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

export async function validarNuevaCompra({
  compra,
  db,
}: {
  compra: Prisma.CompraUncheckedCreateInput
  db: Prisma.TransactionClient
}) {
  const parsedData = compra
  if (
    parsedData.estado_de_compra === EstadoDeCompra.Creado &&
    parsedData.forma_de_pago === FormaDePago.Contado &&
    !parsedData.egreso_dinero_id &&
    !parsedData.despliegue_de_pago_id
  )
    throw new Error(
      'En compras al contado debes seleccionar Egreso asociado o Despliegue de Pago'
    )

  if (
    parsedData.estado_de_compra === EstadoDeCompra.Creado &&
    parsedData.forma_de_pago === FormaDePago.Crédito &&
    (parsedData.egreso_dinero_id || parsedData.despliegue_de_pago_id)
  )
    throw new Error(
      'En compras a crédito no debes seleccionar Egreso asociado ni Despliegue de Pago'
    )

  if (
    parsedData.estado_de_compra === EstadoDeCompra.Creado &&
    parsedData.egreso_dinero_id &&
    parsedData.despliegue_de_pago_id
  )
    throw new Error(
      'No puedes seleccionar Egreso asociado y Despliegue de Pago al mismo tiempo'
    )

  if (
    parsedData.estado_de_compra === EstadoDeCompra.Creado ||
    (parsedData.estado_de_compra === EstadoDeCompra.EnEspera &&
      parsedData.serie &&
      parsedData.numero &&
      parsedData.proveedor_id)
  ) {
    const proveedor_serie_numero = await db.compra.findFirst({
      where: {
        proveedor_id: parsedData.proveedor_id,
        serie: parsedData.serie,
        numero: parsedData.numero,
        ...(parsedData.id ? { id: { not: parsedData.id } } : {}),
      },
      select: {
        id: true,
      },
    })

    if (proveedor_serie_numero)
      throw new Error(
        'Ya existe una compra con el mismo proveedor, serie y número'
      )
  }
}

export async function procesoPostCompra({
  compra,
  db,
}: {
  compra: Prisma.CompraUncheckedCreateInput
  db: Prisma.TransactionClient
}) {
  const parsedData = compra
  if (parsedData.estado_de_compra === EstadoDeCompra.Creado) {
    const compra = await db.compra.findUniqueOrThrow({
      where: { id: parsedData.id },
      include: {
        _count: {
          select: {
            recepciones_almacen: { where: { estado: true } },
            pagos_de_compras: { where: { estado: true } },
          },
        },
        productos_por_almacen: {
          include: {
            unidades_derivadas: true,
          },
        },
      },
    })

    const totalSoles = getTotalCompra({ compra })

    if (compra.egreso_dinero_id) {
      const egreso = await db.egresoDinero.findUnique({
        where: { id: compra.egreso_dinero_id },
        select: { monto: true, vuelto: true },
      })
      if (!egreso) throw new Error('Egreso asociado no encontrado')

      const montoMenosVuelto =
        Number(egreso.monto ?? 0) - Number(egreso.vuelto ?? 0)
      const a = Number(montoMenosVuelto.toFixed(2))
      const b = Number(Number(totalSoles).toFixed(2))
      if (a !== b)
        throw new Error(
          'El monto menos el vuelto del egreso debe ser igual al total de la compra'
        )
    }

    if (compra.despliegue_de_pago_id) {
      const despliegue = await db.despliegueDePago.findUnique({
        where: { id: compra.despliegue_de_pago_id },
        select: { metodo_de_pago_id: true },
      })
      if (!despliegue)
        throw new Error(
          'Despliegue de pago no encontrado para la compra creada'
        )

      await db.metodoDePago.update({
        where: { id: despliegue.metodo_de_pago_id },
        data: {
          monto: {
            decrement: totalSoles,
          },
        },
      })
    }
  }
}

export async function devolverDineroDeCompra({
  compra,
  db,
}: {
  compra: CompraParaCalculo
  db: Prisma.TransactionClient
}) {
  if (compra.estado_de_compra === EstadoDeCompra.Creado) {
    const totalSoles = getTotalCompra({ compra })

    if (compra.despliegue_de_pago_id) {
      const despliegue = await db.despliegueDePago.findUniqueOrThrow({
        where: { id: compra.despliegue_de_pago_id },
        select: { metodo_de_pago_id: true },
      })

      await db.metodoDePago.update({
        where: { id: despliegue.metodo_de_pago_id },
        data: { monto: { increment: totalSoles } },
      })
    }

    if (compra.egreso_dinero_id) {
      const egreso = await db.egresoDinero.findUniqueOrThrow({
        where: { id: compra.egreso_dinero_id },
        select: {
          monto: true,
          vuelto: true,
          despliegue_de_pago_id: true,
        },
      })

      const despliegue = await db.despliegueDePago.findUniqueOrThrow({
        where: { id: egreso.despliegue_de_pago_id },
        select: { metodo_de_pago_id: true },
      })
      const reintegro = Number(egreso.monto ?? 0) - Number(egreso.vuelto ?? 0)
      if (reintegro > 0)
        await db.metodoDePago.update({
          where: { id: despliegue.metodo_de_pago_id },
          data: { monto: { increment: reintegro } },
        })
    }
  }
}
