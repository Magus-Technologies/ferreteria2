import { useQuery } from '@tanstack/react-query'
import { EntregaNueva, entregasNuevasApi } from '~/lib/api/entregas'
import { QueryKeys } from '~/app/_lib/queryKeys'

interface UseEntregasProgramadasParams {
  fecha_desde?: string
  fecha_hasta?: string
  chofer_id?: string
  vehiculo_id?: number
  solo_programadas?: boolean
  enabled?: boolean
}

function normalizarEntregaProgramada(entrega: EntregaNueva | any) {
  const vehiculo = entrega.vehiculo ?? (entrega.vehiculo_id
    ? {
        id: entrega.vehiculo_id,
        name: entrega.vehiculo_name,
        placa: entrega.vehiculo_placa,
      }
    : null)

  const despachador = entrega.despachador ?? entrega.chofer ?? (entrega.chofer_id
    ? {
        id: entrega.chofer_id,
        name: entrega.chofer_name,
      }
    : null)

  const productosEntregados = entrega.productos_entregados ?? entrega.detalles?.map((detalle: any) => ({
    id: detalle.id,
    cantidad_entregada: detalle.cantidad,
    unidad_derivada_venta: {
      cantidad: detalle.cantidad,
      unidad_derivada_inmutable: {
        name: detalle.unidad,
      },
      producto_almacen_venta: {
        producto_almacen: {
          producto: detalle.producto,
        },
      },
    },
  })) ?? []

  return {
    ...entrega,
    estado_entrega: entrega.estado_entrega_codigo ?? entrega.estado_entrega?.codigo ?? entrega.estado_entrega ?? 'pe',
    tipo_despacho: entrega.tipo_despacho_codigo ?? entrega.tipo_despacho?.codigo ?? entrega.tipo_despacho,
    despachador,
    vehiculo,
    productos_entregados: productosEntregados,
  }
}

export function useEntregasProgramadas({
  fecha_desde,
  fecha_hasta,
  chofer_id,
  vehiculo_id,
  solo_programadas = true,
  enabled = true,
}: UseEntregasProgramadasParams = {}) {
  return useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, 'programadas', fecha_desde, fecha_hasta, chofer_id, vehiculo_id, solo_programadas],
    queryFn: async () => {
      const response = await entregasNuevasApi.listar({
        fecha_desde,
        fecha_hasta,
        chofer_id,
        vehiculo_id,
        solo_programadas,
      })

      const payload = response.data as any
      const entregas = Array.isArray(payload) ? payload : payload?.data ?? []

      return entregas.map(normalizarEntregaProgramada)
    },
    enabled,
  })
}
