import {
  Compra,
  Prisma,
  PrismaClient,
  TipoDocumento,
  UnidadDerivada,
  UnidadDerivadaInmutableCompra,
} from '@prisma/client'

const extendedPrisma = new PrismaClient().$extends({
  model: {
    compra: {
      async createAfectaStock(
        data: {
          compra: Omit<
            Prisma.CompraUncheckedCreateInput,
            'productos_por_almacen'
          >
          productos_por_almacen: (Omit<
            Prisma.ProductoAlmacenCompraUncheckedCreateInput,
            'unidades_derivadas' | 'compra_id'
          > & {
            unidades_derivadas: (Omit<
              UnidadDerivadaInmutableCompra,
              'id' | 'unidad_derivada_inmutable_id'
            > & {
              name: UnidadDerivada['name']
            })[]
          })[]
        },
        db: Prisma.TransactionClient
      ) {
        const { productos_por_almacen, compra } = data

        const compra_creada = await db.compra.create({
          data: {
            ...compra,
            productos_por_almacen: {
              create: productos_por_almacen.map(item => ({
                ...item,
                unidades_derivadas: {
                  create: item.unidades_derivadas.map(unidad_derivada => ({
                    unidad_derivada_inmutable_compra: {
                      create: {
                        factor: unidad_derivada.factor,
                        cantidad: unidad_derivada.cantidad,
                        lote: unidad_derivada.lote,
                        vencimiento: unidad_derivada.vencimiento,
                        unidad_derivada_inmutable: {
                          connectOrCreate: {
                            where: {
                              name: unidad_derivada.name,
                            },
                            create: {
                              name: unidad_derivada.name,
                            },
                          },
                        },
                      },
                    },
                  })),
                },
              })),
            },
          },
        })

        for (const item of productos_por_almacen) {
          for (const unidad_derivada of item.unidades_derivadas) {
            await db.productoAlmacen.update({
              where: {
                id: item.producto_almacen_id,
              },
              data: {
                stock_fraccion: {
                  increment: unidad_derivada.cantidad.mul(
                    unidad_derivada.factor
                  ),
                },
                costo: item.costo,
              },
            })
          }
        }

        return compra_creada
      },

      async createPrimeraCompra(
        data: {
          almacen_id: Compra['almacen_id']
          productos_por_almacen: (Omit<
            Prisma.ProductoAlmacenCompraUncheckedCreateInput,
            'unidades_derivadas' | 'compra_id'
          > & {
            unidades_derivadas: (Omit<
              UnidadDerivadaInmutableCompra,
              'id' | 'unidad_derivada_inmutable_id'
            > & {
              name: UnidadDerivada['name']
            })[]
          })[]
        },
        db: Prisma.TransactionClient
      ) {
        const { almacen_id, productos_por_almacen } = data
        const ultima_compra = await db.compra.findFirst({
          where: {
            almacen_id,
            tipo_documento: TipoDocumento.NotaDeVenta,
          },
          orderBy: {
            created_at: 'desc',
          },
        })
        return this.createAfectaStock(
          {
            compra: {
              almacen_id,
              tipo_documento: TipoDocumento.NotaDeVenta,
              serie: 'NTV1',
              numero: (ultima_compra?.numero ?? 0) + 1,
              descripcion: 'Stock inicial por creación de producto',
            },
            productos_por_almacen,
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
