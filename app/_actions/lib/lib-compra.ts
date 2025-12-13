import { Prisma } from '@prisma/client'

export const includeCompra = {
  proveedor: {
    select: {
      id: true,
      ruc: true,
      razon_social: true,
    },
  },
  _count: {
    select: {
      recepciones_almacen: {
        where: {
          estado: true,
        },
      },
      pagos_de_compras: {
        where: {
          estado: true,
        },
      },
    },
  },
  productos_por_almacen: {
    include: {
      producto_almacen: {
        select: {
          id: true,
          producto: {
            select: {
              id: true,
              name: true,
              cod_producto: true,
              marca: { select: { id: true, name: true } },
              unidad_medida: { select: { id: true, name: true } },
            },
          },
        },
      },
      unidades_derivadas: {
        select: {
          id: true,
          cantidad: true,
          unidad_derivada_inmutable: {
            select: { id: true, name: true }
          },
        },
      },
    },
  },
  user: {
    select: {
      id: true,
      name: true,
    },
  },
} satisfies Prisma.CompraInclude
