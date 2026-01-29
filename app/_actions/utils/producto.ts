'use server'

import { Prisma, Producto } from '@prisma/client'
import {
  FormCreateProductoFormatedProps,
  UnidadDerivadaCreateProducto,
} from '~/app/ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-create-producto'
import { ProductoAlmacenUnidadDerivadaUncheckedCreateInputSchema } from '~/prisma/generated/zod'

export async function crearProductoEnAlmacen({
  producto,
  unidades_derivadas,
  producto_almacen,
  almacen_id,
  db,
}: {
  producto: Producto
  unidades_derivadas: UnidadDerivadaCreateProducto[]
  producto_almacen: FormCreateProductoFormatedProps['producto_almacen']
  almacen_id: number
  db: Prisma.TransactionClient
}) {
  const productoAlmacen = await db.productoAlmacen.create({
    data: {
      producto_id: producto.id,
      almacen_id,
      costo: unidades_derivadas.length
        ? unidades_derivadas[0].costo / Number(unidades_derivadas[0].factor)
        : 0,
      ubicacion_id: producto_almacen.ubicacion_id,
    },
  })

  await db.productoAlmacenUnidadDerivada.createMany({
    data: unidades_derivadas.map(item => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { costo, p_venta, ganancia, ...rest } = item
      const data = {
        producto_almacen_id: productoAlmacen.id,
        ...rest,
      }
      const dataParsed =
        ProductoAlmacenUnidadDerivadaUncheckedCreateInputSchema.parse(data)
      return dataParsed
    }),
  })

  const productoAlmacenUnidadDerivada =
    await db.productoAlmacenUnidadDerivada.findFirst({
      where: {
        producto_almacen_id: productoAlmacen.id,
        factor: producto.unidades_contenidas,
      },
      include: {
        unidad_derivada: true,
      },
    })

  if (!productoAlmacenUnidadDerivada)
    return {
      productoAlmacenUnidadDerivada:
        await db.productoAlmacenUnidadDerivada.findFirstOrThrow({
          where: {
            producto_almacen_id: productoAlmacen.id,
          },
          include: {
            unidad_derivada: true,
          },
        }),
      productoAlmacen,
    }
  return { productoAlmacenUnidadDerivada, productoAlmacen }
}

export async function getUltimoIdProducto({
  db,
}: {
  db: Prisma.TransactionClient
}) {
  const ultimo_id = await db.producto.findFirst({
    orderBy: {
      id: 'desc',
    },
    select: {
      id: true,
    },
  })
  return String(ultimo_id?.id ? ultimo_id.id + 1 : 1)
}
