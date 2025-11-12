'use server'

import can from '~/utils/server-validate-permission'
import { FormCreateIngresoSalidaFormatedProps } from '../ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-create-ingreso-salida'
import { permissions } from '~/lib/permissions'
import { prisma } from '~/db/db'
import { Prisma, TipoDocumento } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { getUltimoNumeroIngresoSalida } from './utils/ingreso-salida'
import { auth } from '~/auth/auth'
import { manejoDeCosto } from '../_utils/manejo-de-costo'

const includeGetIngresoSalida = {
  user: true,
  almacen: true,
  proveedor: true,
  tipo_ingreso: true,
  productos_por_almacen: {
    include: {
      producto_almacen: {
        include: {
          producto: true,
        },
      },
      unidades_derivadas: {
        include: {
          unidad_derivada_inmutable: true,
          historial: true,
        },
      },
    },
  },
} satisfies Prisma.IngresoSalidaInclude
export type getIngresoSalidaResponseProps = Prisma.IngresoSalidaGetPayload<{
  include: typeof includeGetIngresoSalida
}>

async function createIngresoSalidaWA(
  data: FormCreateIngresoSalidaFormatedProps
) {
  const puede = await can(permissions.INGRESO_SALIDA_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear ingresos y salidas')

  const session = await auth()

  try {
    return await prisma.$transaction(
      async db => {
        const {
          tipo_documento,
          cantidad,
          unidad_derivada_id,
          producto_id,
          almacen_id,
          fecha,
          ...rest
        } = data

        const productoAlmacen = await db.productoAlmacen.findUnique({
          where: {
            producto_id_almacen_id: {
              producto_id,
              almacen_id,
            },
          },
          select: {
            id: true,
            costo: true,
            stock_fraccion: true,
            unidades_derivadas: {
              where: {
                unidad_derivada_id,
              },
              select: {
                factor: true,
                unidad_derivada: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        })
        if (!productoAlmacen) throw new Error('Producto no encontrado')

        const unidad_derivada = productoAlmacen.unidades_derivadas[0]
        if (!unidad_derivada) throw new Error('Unidad derivada no encontrada')

        const numero = await getUltimoNumeroIngresoSalida({
          db,
          tipo_documento,
        })

        const cantidad_fraccion = unidad_derivada.factor
          .mul(cantidad)
          .mul(tipo_documento === TipoDocumento.Ingreso ? 1 : -1)

        const serie =
          tipo_documento === TipoDocumento.Ingreso
            ? session!.user!.empresa.serie_ingreso
            : session!.user!.empresa.serie_salida

        const item = await db.ingresoSalida.create({
          data: {
            ...rest,
            almacen_id,
            user_id: session!.user!.id!,
            tipo_documento,
            serie,
            fecha: fecha ? new Date(fecha) : undefined,
            numero,
            productos_por_almacen: {
              create: {
                costo: productoAlmacen.costo,
                producto_almacen_id: productoAlmacen.id,
                unidades_derivadas: {
                  create: [
                    {
                      factor: unidad_derivada.factor,
                      cantidad: cantidad,
                      cantidad_restante: cantidad,
                      historial: {
                        create: {
                          stock_anterior: productoAlmacen.stock_fraccion,
                          stock_nuevo:
                            productoAlmacen.stock_fraccion.add(
                              cantidad_fraccion
                            ),
                        },
                      },
                      unidad_derivada_inmutable: {
                        connectOrCreate: {
                          where: {
                            name: unidad_derivada.unidad_derivada.name,
                          },
                          create: {
                            name: unidad_derivada.unidad_derivada.name,
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        })

        const { nuevo_costo } = manejoDeCosto({
          stock_actual: productoAlmacen.stock_fraccion,
          nuevo_stock: productoAlmacen.stock_fraccion
            .add(cantidad_fraccion)
            .toNumber(),
          agregar: tipo_documento === TipoDocumento.Ingreso,
          costo_nuevo: productoAlmacen.costo,
        })

        await db.productoAlmacen.update({
          where: {
            id: productoAlmacen.id,
          },
          data: {
            stock_fraccion: {
              increment: cantidad_fraccion,
            },
            costo: nuevo_costo,
          },
        })

        const result = await db.ingresoSalida.findUniqueOrThrow({
          where: {
            id: item.id,
          },
          include: includeGetIngresoSalida,
        })

        return {
          data: JSON.parse(JSON.stringify(result)) as typeof result,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    )
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002')
        throw new Error(
          'Ya existe un producto con ese código de producto, código de barra o nombre'
        )
      throw new Error(`${error.code}`)
    }

    throw error
  }
}
export const createIngresoSalida = withAuth(createIngresoSalidaWA)
