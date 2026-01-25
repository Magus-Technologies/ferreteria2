import { FormCreateGuia } from '../_components/others/body-crear-guia'
import { useServerMutation } from '~/hooks/use-server-mutation'
import { toUTCBD } from '~/utils/fechas'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { useAuth } from '~/lib/auth-context'

type ProductoAgrupado = Pick<
  FormCreateGuia['productos'][number],
  'producto_id' | 'marca_name' | 'producto_name'
> & {
  unidades_derivadas: Array<
    Omit<
      FormCreateGuia['productos'][number],
      'producto_id' | 'marca_name' | 'producto_name'
    >
  >
}

export function agruparProductos({
  productos,
}: {
  productos: FormCreateGuia['productos']
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
      costo: p.costo,
      precio_venta: p.precio_venta,
      producto_codigo: p.producto_codigo,
    })
  }
  return Array.from(mapa.values())
}

// Función temporal - reemplazar con la acción real del servidor
async function createGuiaTemp(data: any) {
  console.log('📦 Creando guía:', data)
  // Simular delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  return { data: { id: 1, ...data } }
}

export default function useCreateGuia(form?: any) {
  const router = useRouter()
  const { user } = useAuth()
  const user_id = user?.id
  const { can } = usePermissionHook()
  const { notification } = useApp()
  const almacen_id = useStoreAlmacen((store) => store.almacen_id)
  const { execute, loading } = useServerMutation({
    action: createGuiaTemp, // TODO: Reemplazar con createGuia real
    onSuccess: async () => {
      if (form) {
        form.resetFields()
      }
      router.push(`/ui/facturacion-electronica/mis-guias`)
    },
    msgSuccess: `Guía de remisión creada exitosamente`,
  })

  async function handleSubmit(values: FormCreateGuia) {
    console.log('🚀 ~ handleSubmit ~ values:', values)

    if (!can(permissions.GUIA_CREATE))
      return notification.error({
        message: 'No tienes permiso para crear una guía',
      })
    if (!user_id)
      return notification.error({ message: 'No hay un usuario seleccionado' })
    if (!almacen_id)
      return notification.error({ message: 'No hay un almacen seleccionado' })
    
    const { productos, cliente_id, ...restValues } = values
    
    if (!productos || productos.length === 0)
      return notification.error({
        message: 'Por favor, ingresa al menos un producto',
      })

    const productos_agrupados = agruparProductos({ productos })
    
    const dataFormated = {
      ...restValues,
      user_id,
      almacen_id,
      cliente_id,
      fecha_emision: toUTCBD({ date: restValues.fecha_emision })!,
      fecha_traslado: toUTCBD({ date: restValues.fecha_traslado })!,
      productos_por_almacen: productos_agrupados,
    }
    
    console.log('📤 Datos a enviar:', JSON.stringify(dataFormated, null, 2))
    execute(dataFormated)
  }

  return { handleSubmit, loading }
}
