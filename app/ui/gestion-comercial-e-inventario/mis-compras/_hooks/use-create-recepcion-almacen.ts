import { useServerMutation } from '~/hooks/use-server-mutation'
import { toUTCBD } from '~/utils/fechas'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { Compra, Prisma } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { agruparProductos } from '../crear-compra/_hooks/use-create-compra'
import { FormCreateRecepcionAlmacen } from '../_components/modals/modal-crear-recepcion-almacen'
import { createRecepcionAlmacen } from '~/app/_actions/recepcion-almacen'
import { QueryKeys } from '~/app/_lib/queryKeys'

export default function useCreateRecepcionAlmacen({
  compra_id,
  onSuccess,
}: {
  compra_id: Compra['id'] | undefined
  onSuccess?: () => void
}) {
  const { data: session } = useSession()
  const user_id = session?.user?.id

  const can = usePermission()
  const { notification } = useApp()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const { execute, loading } = useServerMutation({
    action: createRecepcionAlmacen,
    queryKey: [QueryKeys.COMPRAS],
    msgSuccess: 'Recepcion de almacen creada exitosamente',
    onSuccess,
  })

  async function handleSubmit(values: FormCreateRecepcionAlmacen) {
    if (!can(permissions.RECEPCION_ALMACEN_CREATE))
      return notification.error({
        message: 'No tienes permiso para crear una recepcion de almacen',
      })
    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })
    if (!compra_id)
      return notification.error({ message: 'No hay una compra seleccionada' })

    const { productos, fecha, ...rest } = values

    const productos_agrupados = agruparProductos({
      productos: productos,
    })

    const dataFormated = {
      ...rest,
      user_id,
      compra_id,
      fecha: toUTCBD({
        date: fecha,
      })!,
      productos_por_almacen: {
        create: productos_agrupados.map(p => {
          const unidad_derivada = p.unidades_derivadas[0]
          const costo_unidad =
            unidad_derivada.precio_compra /
            Number(unidad_derivada.unidad_derivada_factor)
          return {
            costo: costo_unidad,
            producto_almacen: {
              connect: {
                producto_id_almacen_id: {
                  almacen_id,
                  producto_id: p.producto_id,
                },
              },
            },
            unidades_derivadas: {
              create: p.unidades_derivadas.map(u => ({
                unidad_derivada_inmutable: {
                  connectOrCreate: {
                    where: {
                      name: u.unidad_derivada_name,
                    },
                    create: {
                      name: u.unidad_derivada_name,
                    },
                  },
                },
                factor: Number(u.unidad_derivada_factor),
                cantidad: Number(u.cantidad),
                cantidad_restante: Number(u.cantidad),
                lote: u.lote,
                vencimiento: u.vencimiento,
                bonificacion: u.bonificacion,
                flete: u.flete,
              })),
            },
          }
        }),
      },
    } satisfies Omit<Prisma.RecepcionAlmacenUncheckedCreateInput, 'numero'>
    execute(dataFormated)
  }

  return {
    handleSubmit,
    loading,
  }
}
