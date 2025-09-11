'use server'

import can from '~/utils/server-validate-permission'
import { FormCreateIngresoSalidaFormatedProps } from '../ui/gestion-comercial-e-inventario/mi-almacen/_components/modals/modal-create-ingreso-salida'
import { permissions } from '~/lib/permissions'
import { prisma } from '~/db/db'
import { Prisma } from '@prisma/client'
import { withAuth } from '~/auth/middleware-server-actions'
import { getUltimoIdIngresoSalida } from './utils/ingreso-salida'
import { IngresoSalidaEnum } from '../_lib/tipos-ingresos-salidas'

async function createIngresoSalidaWA(
  data: FormCreateIngresoSalidaFormatedProps
) {
  const puede = await can(permissions.INGRESO_SALIDA_CREATE)
  if (!puede) throw new Error('No tienes permiso para crear ingresos y salidas')

  try {
    return await prisma.$transaction(
      async db => {
        const {
          tipo,
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
            unidades_derivadas: {
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

        const unidad_derivada = productoAlmacen.unidades_derivadas.find(
          item => item.unidad_derivada.id === unidad_derivada_id
        )

        if (!unidad_derivada) throw new Error('Unidad derivada no encontrada')

        const numero = await getUltimoIdIngresoSalida({
          db,
        })

        const item = await db.ingresoSalida.create({
          data: {
            ...rest,
            fecha: fecha ? new Date(fecha) : undefined,
            numero,
            productos_por_almacen: {
              create: [
                {
                  costo: productoAlmacen.costo,
                  producto_almacen_id: productoAlmacen.id,
                  unidades_derivadas: {
                    create: [
                      {
                        factor: unidad_derivada.factor,
                        cantidad: unidad_derivada.factor
                          .mul(cantidad)
                          .mul(tipo === IngresoSalidaEnum.ingreso ? 1 : -1),
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
              ],
            },
          },
        })

        await db.productoAlmacen.update({
          where: {
            id: productoAlmacen.id,
          },
          data: {
            stock_fraccion: {
              increment: unidad_derivada.factor
                .mul(cantidad)
                .mul(tipo === IngresoSalidaEnum.ingreso ? 1 : -1),
            },
            costo: productoAlmacen.costo,
          },
        })

        return {
          data: item,
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

    throw new Error('Error al crear el ingreso/salida')
  }
}
export const createIngresoSalida = withAuth(createIngresoSalidaWA)
