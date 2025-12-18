import { createCompra, editarCompra } from '~/app/_actions/compra'
import { FormCreateCompra } from '../_components/others/body-comprar'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { toUTCBD } from '~/utils/fechas'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { EstadoDeCompra, FormaDePago, Prisma, TipoMoneda } from '@prisma/client'
import { useAuth } from '~/lib/auth-context'
import { CompraConUnidadDerivadaNormal } from '../_components/others/header'
// 2025-10-30 16:52:39.655
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

export function agruparProductos({
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

export default function useCreateCompra({
  compra,
}: {
  compra?: CompraConUnidadDerivadaNormal
} = {}) {
  const router = useRouter()

  const { user } = useAuth()
  const user_id = user?.id

  const can = usePermission()
  const { notification } = useApp()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)
  const { execute, loading } = useServerMutation({
    action: compra ? editarCompra : createCompra,
    onSuccess: async () => {
      router.push(`/ui/gestion-comercial-e-inventario/mis-compras`)
    },
    msgSuccess: `Compra ${compra ? 'editada' : 'creada'} exitosamente`,
  })

  async function handleSubmit(values: FormCreateCompra) {
    if (!compra && !can(permissions.COMPRAS_CREATE))
      return notification.error({
        message: 'No tienes permiso para crear una compra',
      })
    if (compra && !can(permissions.COMPRAS_UPDATE))
      return notification.error({
        message: 'No tienes permiso para editar una compra',
      })

    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })

    if (
      values.estado_de_compra === EstadoDeCompra.Creado &&
      (!values.serie || !values.numero || !values.proveedor_id)
    )
      return notification.error({
        message: 'Por favor, ingresa la serie, el número y el proveedor',
      })

    const { productos, tipo_de_cambio, tipo_moneda, ...restValues } = values

    if (!productos || productos.length === 0)
      return notification.error({
        message: 'Por favor, ingresa al menos un producto',
      })

    const productos_agrupados = agruparProductos({
      productos: productos,
    })

    const dataFormated = {
      ...restValues,
      ...(compra ? { id: compra.id } : {}),
      tipo_moneda,
      tipo_de_cambio: tipo_moneda === TipoMoneda.Soles ? 1 : tipo_de_cambio,
      user_id,
      fecha: toUTCBD({
        date: restValues.fecha,
      })!,
      numero_dias:
        restValues.forma_de_pago === FormaDePago.Contado
          ? undefined
          : restValues.numero_dias,
      fecha_vencimiento:
        restValues.forma_de_pago === FormaDePago.cr &&
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
                cantidad_pendiente: Number(u.cantidad),
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
    execute(dataFormated)
  }

  return {
    handleSubmit,
    loading,
  }
}
