'use server'

import {
  Almacen,
  Prisma,
  TipoDocumento,
  UnidadDerivada,
  UnidadDerivadaInmutableCompra,
} from '@prisma/client'

export async function createCompraAfectaStock(
  data: {
    compra: Omit<Prisma.CompraUncheckedCreateInput, 'productos_por_almacen'>
    productos_por_almacen: (Omit<
      Prisma.ProductoAlmacenCompraUncheckedCreateInput,
      'unidades_derivadas' | 'compra_id'
    > & {
      unidades_derivadas: (Omit<
        UnidadDerivadaInmutableCompra,
        'id' | 'unidad_derivada_inmutable_id' | 'producto_almacen_compra_id'
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
            })) satisfies Prisma.UnidadDerivadaInmutableCompraCreateWithoutProducto_almacen_compraInput[],
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
            increment: unidad_derivada.cantidad.mul(unidad_derivada.factor),
          },
          costo: item.costo,
        },
      })
    }
  }

  return compra_creada
}

export async function createPrimeraCompra(
  data: {
    almacen_id: Almacen['id']
    productos_por_almacen: (Omit<
      Prisma.ProductoAlmacenCompraUncheckedCreateInput,
      'unidades_derivadas' | 'compra_id'
    > & {
      unidades_derivadas: (Omit<
        UnidadDerivadaInmutableCompra,
        'id' | 'unidad_derivada_inmutable_id' | 'producto_almacen_compra_id'
      > & {
        name: UnidadDerivada['name']
      })[]
    })[]
  },
  db: Prisma.TransactionClient
) {
  const { productos_por_almacen, almacen_id } = data
  const ultima_compra = await db.compra.findFirst({
    where: {
      productos_por_almacen: {
        some: {
          producto_almacen: {
            almacen_id,
          },
        },
      },
      tipo_documento: TipoDocumento.NotaDeVenta,
    },
    orderBy: {
      created_at: 'desc',
    },
  })
  return createCompraAfectaStock(
    {
      compra: {
        tipo_documento: TipoDocumento.NotaDeVenta,
        serie: 'NTV1',
        numero: (ultima_compra?.numero ?? 0) + 1,
        descripcion: 'Stock inicial por creación de producto',
      },
      productos_por_almacen,
    },
    db
  )
}
