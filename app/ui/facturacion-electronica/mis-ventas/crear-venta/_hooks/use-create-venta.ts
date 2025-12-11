import { createVenta } from '~/app/_actions/venta'
import { FormCreateVenta } from '../_components/others/body-vender'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { toUTCBD } from '~/utils/fechas'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { Prisma, TipoMoneda } from '@prisma/client'
import { useSession } from 'next-auth/react'

type ProductoAgrupado = Pick<
  FormCreateVenta['productos'][number],
  'producto_id' | 'marca_name' | 'producto_name'
> & {
  unidades_derivadas: Array<
    Omit<
      FormCreateVenta['productos'][number],
      'producto_id' | 'marca_name' | 'producto_name' | 'subtotal'
    >
  >
}

export function agruparProductos({
  productos,
}: {
  productos: FormCreateVenta['productos']
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
      unidad_derivada_name: p.unidad_derivada_name,
      unidad_derivada_factor: p.unidad_derivada_factor,
      precio_venta: p.precio_venta,
      recargo: p.recargo,
      producto_codigo: p.producto_codigo,
    })
  }
  return Array.from(mapa.values())
}

export default function useCreateVenta() {
  const router = useRouter()
  const { data: session } = useSession()
  const user_id = session?.user?.id
  const can = usePermission()
  const { notification } = useApp()
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const { execute, loading } = useServerMutation({
    action: createVenta,
    onSuccess: async () => {
      router.push(`/ui/facturacion-electronica`)
    },
    msgSuccess: `Venta creada exitosamente`,
  })

  async function handleSubmit(values: FormCreateVenta) {
    console.log('🚀 ~ handleSubmit ~ values:', values)

    if (!can(permissions.FACTURACION_ELECTRONICA_INDEX))
      return notification.error({
        message: 'No tienes permiso para crear una venta',
      })
    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })
    const {
      productos,
      tipo_de_cambio,
      tipo_moneda,
      estado_de_venta,
      cliente_id,
      recomendado_por_id,
      ...restValues
    } = values
    if (!productos || productos.length === 0)
      return notification.error({
        message: 'Por favor, ingresa al menos un producto',
      })

    const productos_agrupados = agruparProductos({ productos })
    const dataFormated = {
      ...restValues,
      estado_de_venta,
      tipo_moneda,
      tipo_de_cambio: tipo_moneda === TipoMoneda.Soles ? 1 : tipo_de_cambio,
      user: {
        connect: { id: user_id }
      },
      fecha: toUTCBD({ date: restValues.fecha })!,
      almacen: {
        connect: { id: almacen_id }
      },
      // cliente: restValues.cliente_id ? {
        cliente: cliente_id ? {        // ← CAMBIAR: usar la variable directa
        // connect: { id: restValues.cliente_id }
            connect: { id: cliente_id }
      } : undefined,
      // recomendado_por: restValues.recomendado_por_id ? {
        recomendado_por: recomendado_por_id ? {  // ← CAMBIAR: usar la variable directa
        // connect: { id: restValues.recomendado_por_id }
        connect: { id: recomendado_por_id }
      } : undefined,
      productos_por_almacen: {
        create: productos_agrupados.map((p) => {
          return {
            costo: 1,
            producto_almacen: {
              connect: {
                producto_id_almacen_id: {
                  almacen_id,
                  producto_id: p.producto_id,
                },
              },
            },
            unidades_derivadas: {
              create: p.unidades_derivadas.map((u) => ({
                unidad_derivada_inmutable: {
                  connectOrCreate: {
                    where: { name: u.unidad_derivada_name },
                    create: { name: u.unidad_derivada_name },
                  },
                },
                factor: Number(u.unidad_derivada_factor),
                cantidad: Number(u.cantidad),
                cantidad_pendiente: Number(u.cantidad),
                precio: Number(u.precio_venta),
              })),
            },
          }
        }),
      },
    } satisfies Prisma.VentaCreateInput
     console.log('📤 Datos a enviar:', JSON.stringify(dataFormated, null, 2))
    execute(dataFormated)
  }

  return { handleSubmit, loading }
}
