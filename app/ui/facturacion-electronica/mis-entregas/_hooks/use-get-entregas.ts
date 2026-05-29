import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { useStoreFiltrosMisEntregas } from '../_store/store-filtros-mis-entregas'
import { useAuth } from '~/lib/auth-context'
import { entregasNuevasApi, type EntregaNueva } from '~/lib/api/entregas'

/**
 * Map EntregaNueva (new entrega table) → shape compatible with TableMisEntregas
 * (which was designed for the old EntregaDB format).
 */
function mapToEntregaDB(e: EntregaNueva): any {
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
    created_at:       e.fecha_creacion ?? '',
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
    } : null,

    // Chofer / vehiculo
    chofer:   e.chofer_name ? { name: e.chofer_name } : undefined,
    vehiculo: e.vehiculo_placa
      ? { placa: e.vehiculo_placa, name: (e as any).vehiculo_name }
      : undefined,

    // Detalles → mapped to old productos_entregados shape for TableDetalleEntrega
    productos_entregados: (e.detalles ?? []).map((d: any) => ({
      id:                       d.id,
      unidad_derivada_venta_id: d.unidad_derivada_venta_id,
      cantidad_entregada:       d.cantidad,
      unidad_derivada_venta: {
        cantidad:          d.cantidad,
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

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [QueryKeys.ENTREGAS_PRODUCTOS, filtros, user?.id, esDespachador],
    queryFn: async () => {
      const response = await entregasNuevasApi.listar({
        fecha_desde:  filtros.fecha_desde?.format('YYYY-MM-DD'),
        fecha_hasta:  filtros.fecha_hasta?.format('YYYY-MM-DD'),
        estado:       filtros.estado_entrega?.length ? filtros.estado_entrega : undefined,
        tipo_entrega: filtros.tipo_entrega as string | undefined,
        chofer_id:    esDespachador ? user?.id : undefined,
        search:       filtros.search,
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
