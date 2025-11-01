import { Prisma } from '@prisma/client'

export const includeCompra = {
  proveedor: true,
  _count: {
    select: {
      recepciones_almacen: {
        where: {
          estado: true,
        },
      },
    },
  },
  productos_por_almacen: {
    include: {
      producto_almacen: {
        include: {
          producto: {
            include: {
              marca: true,
              unidad_medida: true,
            },
          },
        },
      },
      unidades_derivadas: {
        include: {
          unidad_derivada_inmutable: true,
        },
      },
    },
  },
  user: true,
} satisfies Prisma.CompraInclude
