import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosMisEntregas } from '../_store/store-filtros-mis-entregas'
import { useAuth } from '~/lib/auth-context'
import { entregasNuevasApi, type EntregaNueva } from '~/lib/api/entregas'
import { configuracionEntregaApi } from '~/lib/api/configuracion-entrega'

/**
 * Map EntregaNueva (new entrega table) → shape compatible with TableMisEntregas
 * (which was designed for the old EntregaDB format).
 */
export function mapToEntregaDB(e: EntregaNueva): any {
  const venta = (e as any).venta ?? null

  return {
    // Identity
    id:         e.id,
    venta_id:   e.venta_id,

    // State — old table reads entrega.estado_entrega (not _codigo)
    estado_entrega: e.estado_entrega_codigo,
    tipo_entrega:   e.tipo_entrega_codigo,
    tipo_despacho:  e.tipo_despacho_codigo,
    quien_entrega:  e.quien_entrega_codigo,

    // Dates
    fecha_entrega:    e.fecha_ejecutada ?? e.fecha_creacion ?? '',
    fecha_programada: e.fecha_programada ?? undefined,
    hora_inicio:      e.hora_inicio ?? undefined,
    hora_fin:         e.hora_fin ?? undefined,
    // La columna "Fecha Registro" lee `fecha_creacion` del row. Preferir el
    // timestamp real (created_at) para mostrar hora y ordenar entregas del
    // mismo dia; fallback al date-only para respuestas cacheadas viejas.
    fecha_creacion:   (e as any).created_at ?? e.fecha_creacion ?? '',
    created_at:       (e as any).created_at ?? e.fecha_creacion ?? '',
    updated_at:       '',

    // Location
    direccion_entrega:  (e as any).direccion_entrega,
    referencia_entrega: (e as any).referencia_entrega,
    latitud:            (e as any).latitud ?? null,
    longitud:           (e as any).longitud ?? null,
    observaciones:      (e as any).observaciones,

    // Venta nested (needed by columns-mis-entregas.tsx)
    venta: venta ? {
      id:     venta.id,
      serie:  venta.serie,
      numero: venta.numero,
      cliente: venta.cliente ? {
        id:                venta.cliente.id,
        razon_social:      venta.cliente.razon_social,
        telefono:          venta.cliente.telefono,
        numero_documento:  venta.cliente.numero_documento,
        nombres:           venta.cliente.nombres,
        apellidos:         venta.cliente.apellidos,
        direccion:         venta.cliente.direccion,
        // Direcciones con GPS — el modal Mapa de Entrega las usa para centrar
        // el mapa sin geocodificar cuando la entrega no tiene coords propias.
        direcciones:       venta.cliente.direcciones ?? [],
      } : null,
      // Self-include this entrega so acumuladosPorUdv in TableDetalleEntrega can
      // compute entregado/pendiente without needing all siblings from the server.
      // For confirmed entregas ("en"), this makes entregado = delivery qty and
      // pendiente = udv_total − entregado. For pending ("pe"/"ec"), entregado = 0.
      entregas_productos: [{
        id:              e.id,
        estado_entrega:  e.estado_entrega_codigo,
        productos_entregados: (e.detalles ?? []).map((d: any) => ({
          unidad_derivada_venta_id: d.unidad_derivada_venta_id,
          cantidad_entregada:       d.cantidad,
        })),
      }],
    } : null,

    // Chofer / vehiculo / usuario que entregó / almacén
    chofer:         e.chofer_name ? { name: e.chofer_name } : undefined,
    userEntregado:  (e as any).user_entregado_name ? { name: (e as any).user_entregado_name } : undefined,
    almacenSalida:  (e as any).almacen_salida_name ? { name: (e as any).almacen_salida_name } : undefined,
    fecha_ejecutada: e.fecha_ejecutada ?? undefined,
    vehiculo: e.vehiculo_placa
      ? { placa: e.vehiculo_placa, name: (e as any).vehiculo_name }
      : undefined,

    // Detalles → mapped to old productos_entregados shape for TableDetalleEntrega
    productos_entregados: (e.detalles ?? []).map((d: any) => ({
      id:                       d.id,
      unidad_derivada_venta_id: d.unidad_derivada_venta_id,
      cantidad_entregada:       d.cantidad,
      unidad_derivada_venta: {
        // udv_cantidad is the UDV total (full venta qty); d.cantidad is only
        // what this specific delivery covers. Using the UDV total ensures the
        // "Total" column shows the venta quantity, not just this delivery's qty.
        cantidad:          (d as any).udv_cantidad ?? d.cantidad,
        // cantidad_guiada POR ENTREGA (no de la línea de venta) — lo usa
        // `todoGuiado` en cell-acciones-entrega para bloquear "Crear Guía"
        // cuando ya se guió toda la cantidad de ESTA entrega.
        cantidad_guiada:   d.cantidad_guiada ?? 0,
        cantidad_pendiente: d.cantidad_pendiente ?? 0,
        factor:            d.factor ?? 1,
        unidad_derivada_inmutable: { name: d.unidad ?? '' },
        // TableDetalleEntrega reads snake_case: ud.producto_almacen_venta?.producto_almacen?.producto
        producto_almacen_venta: {
          producto_almacen: {
            producto: d.producto ? {
              name:         d.producto.name,
              cod_producto: d.producto.cod_producto,
              img:          d.producto.img,
              ubicacion_almacen: d.producto.ubicacion_almacen,
              marca:        { name: '—' },
            } : { name: '—', cod_producto: '—', marca: { name: '—' } },
          },
        },
      },
    })),

    // Fields used by calcularColorEntrega (no grupo concept in new system)
    grupo_entrega_id: null,
    almacen_salida_id: 0,
    user_id: '',

    // Keep original new-format fields accessible via spread (for action buttons)
    estado_entrega_codigo: e.estado_entrega_codigo,
    tipo_entrega_codigo:   e.tipo_entrega_codigo,
    es_final:              e.es_final,
  }
}

export default function useGetEntregas() {
  const { filtros } = useStoreFiltrosMisEntregas()
  const { user } = useAuth()

  const esDespachador = user?.rol_sistema === 'DESPACHADOR'
  const esAdmin = user?.rol_sistema === 'ADMINISTRADOR'

  const { data: configData } = useQuery({
    queryKey: ['configuracion-entrega'],
    queryFn: () => configuracionEntregaApi.get(),
    staleTime: 5 * 60 * 1000,
  })

  const rolesEntregaTienda: string[] = (configData?.data as any)?.roles_entrega_tienda ?? ['almacenero']
  // Chequear ambos identificadores: role_name (nuevo, sin rol_sistema) y rol_sistema (compat)
  const puedeVerRecojoTienda = !esAdmin && (
    rolesEntregaTienda.includes(user?.role_name ?? '') ||
    rolesEntregaTienda.includes(user?.rol_sistema ?? '')
  )

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, filtros, user?.id, esAdmin, puedeVerRecojoTienda],
    queryFn: async () => {
      const response = await entregasNuevasApi.listar({
        fecha_desde:           filtros.fecha_desde?.format('YYYY-MM-DD'),
        fecha_hasta:           filtros.fecha_hasta?.format('YYYY-MM-DD'),
        estado:                filtros.estado_entrega?.length ? filtros.estado_entrega : undefined,
        tipo_entrega:          filtros.tipo_entrega as string | undefined,
        chofer_id:             esAdmin ? undefined : user?.id,
        incluir_recojo_tienda: puedeVerRecojoTienda ? true : undefined,
        search:                filtros.search,
      })

      // apiRequest wraps the body as { data: body }, and Laravel resource
      // collections return { data: [...] }, so we need response.data?.data
      const raw = (response.data as any)?.data ?? (response.data as any) ?? []
      const entregas: EntregaNueva[] = Array.isArray(raw) ? raw : []
      return entregas.map(mapToEntregaDB)
    },
    enabled: !!user?.id,
  })

  return {
    entregas: (data || []) as any[],
    loading:  isFetching,
    error,
    refetch,
  }
}
