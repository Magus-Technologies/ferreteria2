import {
  Compra,
  Prisma,
  PrismaClient,
  ProductoAlmacenCompra,
  ProductoAlmacenUnidadDerivadaCompra,
  TipoDocumento,
} from '@prisma/client'

const extendedPrisma = new PrismaClient().$extends({
  model: {
    compra: {
      async createAfectaStock(
        data: Omit<Compra, 'id' | 'created_at' | 'updated_at'> & {
          productos_por_unidad_derivada: Omit<
            ProductoAlmacenUnidadDerivadaCompra,
            'id' | 'compra_id'
          >[]
          productos_por_almacen: Omit<
            ProductoAlmacenCompra,
            'id' | 'compra_id'
          >[]
        },
        db: Prisma.TransactionClient
      ) {
        const {
          productos_por_unidad_derivada,
          productos_por_almacen,
          ...rest
        } = data
        const compra = await db.compra.create({
          data: {
            ...rest,
            productos_por_unidad_derivada: {
              create: productos_por_unidad_derivada,
            },
            productos_por_almacen: {
              create: productos_por_almacen,
            },
          },
        })

        for (const item of productos_por_unidad_derivada) {
          const itemCompra =
            await db.productoAlmacenUnidadDerivadaCompra.findFirstOrThrow({
              where: {
                compra_id: compra.id,
                producto_almacen_unidad_derivada_id:
                  item.producto_almacen_unidad_derivada_id,
              },
              select: {
                producto_almacen_unidad_derivada: {
                  select: {
                    producto_almacen: {
                      select: {
                        id: true,
                      },
                    },
                    factor: true,
                  },
                },
              },
            })

          await db.productoAlmacen.update({
            where: {
              id: itemCompra.producto_almacen_unidad_derivada.producto_almacen
                .id,
            },
            data: {
              stock_fraccion: {
                increment: item.cantidad.mul(
                  itemCompra.producto_almacen_unidad_derivada.factor
                ),
              },
            },
          })
        }

        for (const item of productos_por_almacen) {
          await db.productoAlmacen.update({
            where: {
              id: item.producto_almacen_id,
            },
            data: {
              costo: item.costo,
            },
          })
        }

        return compra
      },

      async createPrimeraCompra(
        data: Omit<
          Compra,
          | 'id'
          | 'created_at'
          | 'updated_at'
          | 'tipo_documento'
          | 'serie'
          | 'numero'
          | 'descripcion'
        > & {
          productos_por_unidad_derivada: Omit<
            ProductoAlmacenUnidadDerivadaCompra,
            'id' | 'compra_id'
          >[]
          productos_por_almacen: Omit<
            ProductoAlmacenCompra,
            'id' | 'compra_id'
          >[]
        },
        db: Prisma.TransactionClient
      ) {
        const ultima_compra = await db.compra.findFirst({
          where: {
            almacen_id: data.almacen_id,
            tipo_documento: TipoDocumento.XX,
          },
          orderBy: {
            created_at: 'desc',
          },
        })
        return this.createAfectaStock(
          {
            ...data,
            tipo_documento: TipoDocumento.XX,
            serie: 'NTV1',
            numero: (ultima_compra?.numero ?? 0) + 1,
            descripcion: 'Stock inicial por creación de producto',
          },
          db
        )
      },
    },
  },
})

export type ExtendedPrismaClient = typeof extendedPrisma

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient
}

export const prisma = globalForPrisma.prisma ?? extendedPrisma
export type ExtendedTransactionClient = Parameters<
  Parameters<ExtendedPrismaClient['$transaction']>[0]
>[0]

if (process.env.NODE_ENV !== 'production')
  globalForPrisma.prisma = extendedPrisma
