import { FormCreateCompra } from '../_components/others/body-comprar'
import { toUTCBD } from '~/utils/fechas'
import { useStoreAlmacen } from '~/store/store-almacen'
import useApp from 'antd/es/app/useApp'
import { useRouter } from 'next/navigation'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import { EstadoDeCompra, FormaDePago, TipoDocumento, TipoMoneda } from '@prisma/client'
import { useAuth } from '~/lib/auth-context'
import { CompraConUnidadDerivadaNormal } from '../_components/others/header'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { compraApi } from '~/lib/api/compra'
import { QueryKeys } from '~/app/_lib/queryKeys'

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
  const queryClient = useQueryClient()

  const { user } = useAuth()
  const user_id = user?.id

  const { can } = usePermissionHook()
  const { notification, message } = useApp()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const mutation = useMutation({
    mutationFn: async (values: FormCreateCompra) => {
      const { productos, tipo_de_cambio, tipo_moneda, ...restValues } = values

      const productos_agrupados = agruparProductos({
        productos: productos,
      })

      // Map Prisma enum values to Laravel enum values
      const estadoDeCompraMap: Record<EstadoDeCompra, string> = {
        [EstadoDeCompra.Creado]: 'cr',
        [EstadoDeCompra.EnEspera]: 'ee',
        [EstadoDeCompra.Anulado]: 'an',
        [EstadoDeCompra.Procesado]: 'pr',
      }

      const formaDePagoMap: Record<FormaDePago, string> = {
        [FormaDePago.Contado]: 'co',
        [FormaDePago.cr]: 'cr', // Crédito
      }

      const tipoMonedaMap: Record<TipoMoneda, string> = {
        [TipoMoneda.Soles]: 's',
        [TipoMoneda.d]: 'd', // Dólares
      }

      const tipoDocumentoMap: Record<TipoDocumento, string> = {
        [TipoDocumento.Factura]: '01',
        [TipoDocumento.Boleta]: '03',
        [TipoDocumento.NotaDeVenta]: 'nv',
        [TipoDocumento.Ingreso]: 'in',
        [TipoDocumento.Salida]: 'sa',
        [TipoDocumento.RecepcionAlmacen]: 'rc',
      }

      // Transform to Laravel API format
      const dataFormated = {
        ...(compra?.id ? { id: compra.id } : {}), // Solo enviar ID si es edición
        tipo_documento: tipoDocumentoMap[values.tipo_documento],
        serie: values.serie ?? null,
        numero: values.numero ?? null,
        descripcion: values.descripcion ?? null,
        forma_de_pago: formaDePagoMap[values.forma_de_pago],
        tipo_moneda: tipoMonedaMap[tipo_moneda],
        tipo_de_cambio: tipo_moneda === TipoMoneda.Soles ? 1 : tipo_de_cambio,
        percepcion: values.percepcion ?? 0,
        numero_dias:
          values.forma_de_pago === FormaDePago.Contado
            ? null
            : values.numero_dias ?? null,
        fecha_vencimiento:
          values.forma_de_pago === FormaDePago.cr &&
          values.fecha_vencimiento
            ? toUTCBD({
                date: values.fecha_vencimiento,
              })
            : null,
        fecha: toUTCBD({
          date: values.fecha,
        })!,
        guia: values.guia ?? null,
        estado_de_compra: estadoDeCompraMap[values.estado_de_compra ?? EstadoDeCompra.EnEspera],
        egreso_dinero_id: values.egreso_dinero_id ?? null,
        despliegue_de_pago_id: values.despliegue_de_pago_id ?? null,
        user_id: user_id!,
        almacen_id: almacen_id!,
        proveedor_id: values.proveedor_id!,
        productos_por_almacen: productos_agrupados.map(p => {
          const unidad_derivada = p.unidades_derivadas[0]
          const costo_unidad =
            unidad_derivada.precio_compra /
            Number(unidad_derivada.unidad_derivada_factor)

          return {
            costo: costo_unidad,
            producto_id: p.producto_id,
            unidades_derivadas: p.unidades_derivadas.map(u => ({
              unidad_derivada_inmutable_name: u.unidad_derivada_name,
              factor: Number(u.unidad_derivada_factor),
              cantidad: Number(u.cantidad),
              cantidad_pendiente: Number(u.cantidad),
              lote: u.lote ?? null,
              vencimiento: u.vencimiento ?? null,
              bonificacion: u.bonificacion ?? false,
              flete: u.flete ?? 0,
            })),
          }
        }),
      }

      const result = compra
        ? await compraApi.update(compra.id, dataFormated)
        : await compraApi.create(dataFormated)

      if (result.error) {
        throw new Error(result.error.message)
      }

      return result.data!.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.COMPRAS] })
      message.success(`Compra ${compra ? 'editada' : 'creada'} exitosamente`)

      // Actualizar caché de productos para bloquear botón eliminar
      const productosCompradosIds = variables.productos.map((p) => p.producto_id)
      const uniqueProductoIds = [...new Set(productosCompradosIds)]

      queryClient.setQueriesData(
        {
          predicate: (query) =>
            query.queryKey[0] === 'productos-by-almacen' ||
            query.queryKey[0] === 'productos-search',
        },
        (oldData: any) => {
          if (!oldData?.data) return oldData

          return {
            ...oldData,
            data: oldData.data.map((producto: any) => {
              if (uniqueProductoIds.includes(producto.id)) {
                return {
                  ...producto,
                  tiene_ingresos: true, // Bloquear botón eliminar inmediatamente
                }
              }
              return producto
            }),
          }
        }
      )

      router.push(`/ui/gestion-comercial-e-inventario/mis-compras`)
    },
    onError: (error: Error) => {
      notification.error({
        message: 'Error al crear la compra',
        description: error.message,
      })
    },
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

    const { productos } = values

    if (!productos || productos.length === 0)
      return notification.error({
        message: 'Por favor, ingresa al menos un producto',
      })

    mutation.mutate(values)
  }

  return {
    handleSubmit,
    loading: mutation.isPending,
  }
}
