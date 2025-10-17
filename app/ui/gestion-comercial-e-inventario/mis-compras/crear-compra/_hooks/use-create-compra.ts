import { createCompra } from '~/app/_actions/compra'
import { FormCreateCompra } from '../_components/others/body-comprar'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { toUTCBD } from '~/utils/fechas'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { FormaDePago, Prisma } from '@prisma/client'
import { useSession } from 'next-auth/react'

type ProductoAgrupado = Pick<
  FormCreateCompra['productos'][number],
  'producto_id' | 'marca_name' | 'producto_name'
> & {
  unidades_derivadas: Array<
    Omit<
      FormCreateCompra['productos'][number],
      | 'producto_id'
      | 'marca_name'
      | 'producto_name'
      | 'subtotal'
      | 'vencimiento'
    > & {
      vencimiento?: string
    }
  >
}

function agruparProductos({
  productos,
}: {
  productos: FormCreateCompra['productos']
}) {
  const mapa = new Map<number, ProductoAgrupado>()

  for (const p of productos) {
    if (!mapa.has(p.producto_id)) {
      mapa.set(p.producto_id, {
        producto_id: p.producto_id,
        marca_name: p.marca_name,
        producto_name: p.producto_name,
        unidades_derivadas: [],
      })
    }

    const grupo = mapa.get(p.producto_id)!
    grupo.unidades_derivadas.push({
      cantidad: p.cantidad,
      unidad_derivada_id: p.unidad_derivada_id,
      precio_compra: p.bonificacion ? 0 : p.precio_compra,
      lote: p.lote,
      vencimiento: p.vencimiento
        ? toUTCBD({
            date: p.vencimiento,
          })
        : undefined,
      bonificacion: p.bonificacion,
      flete: p.flete,
      unidad_derivada_name: p.unidad_derivada_name,
      unidad_derivada_factor: p.unidad_derivada_factor,
    })
  }

  return Array.from(mapa.values())
}

export default function useCreateCompra() {
  const router = useRouter()

  const { data: session } = useSession()
  const user_id = session?.user?.id

  const can = usePermission()
  const { notification } = useApp()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const { execute, loading } = useServerMutation({
    action: createCompra,
    onSuccess: async () => {
      router.push(`/ui/gestion-comercial-e-inventario/mis-compras`)
    },
    msgSuccess: 'Compra creada exitosamente',
  })

  async function handleSubmit(values: FormCreateCompra) {
    if (!can(permissions.COMPRAS_CREATE))
      return notification.error({
        message: 'No tienes permiso para crear una compra',
      })
    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })

    const { productos, ...restValues } = values

    const productos_agrupados = agruparProductos({
      productos: productos,
    })

    const dataFormated = {
      ...restValues,
      user_id,
      fecha: toUTCBD({
        date: restValues.fecha,
      })!,
      numero_dias:
        restValues.forma_de_pago === FormaDePago.Contado
          ? undefined
          : restValues.numero_dias,
      fecha_vencimiento:
        restValues.forma_de_pago === FormaDePago.Crédito &&
        restValues.fecha_vencimiento
          ? toUTCBD({
              date: restValues.fecha_vencimiento,
            })
          : undefined,
      almacen_id,
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
                lote: u.lote,
                vencimiento: u.vencimiento,
                bonificacion: u.bonificacion,
                flete: u.flete,
              })),
            },
          }
        }),
      },
    } satisfies Prisma.CompraUncheckedCreateInput
    console.log(
      '🚀 ~ file: use-create-compra.ts:162 ~ dataFormated:',
      dataFormated
    )
    execute(dataFormated)
  }

  return {
    handleSubmit,
    loading,
  }
}
