import { apiRequest, ApiResponse } from '../api'

// ============= ENUMS =============

export enum TipoEntrega {
  RECOJO_EN_TIENDA = 'RECOJO_EN_TIENDA',
  DESPACHO = 'DESPACHO',
  PARCIAL = 'PARCIAL',
}

export enum TipoDespacho {
  INMEDIATO = 'INMEDIATO',
  PROGRAMADO = 'PROGRAMADO',
}

export enum EstadoEntrega {
  PENDIENTE = 'PENDIENTE',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
}

// ============= INTERFACES =============

export interface Entrega {
  id: number
  venta_id: number
  tipo_entrega: TipoEntrega
  tipo_despacho: TipoDespacho
  estado_entrega: EstadoEntrega
  fecha_entrega: string
  fecha_programada?: string
  hora_inicio?: string
  hora_fin?: string
  direccion_entrega?: string
  observaciones?: string
  almacen_salida_id: number
  despachador_id?: string
  quien_entrega?: 'vendedor' | 'almacen'
  user_id: string
  createdAt: string
  updatedAt: string
  
  // Relaciones
  venta?: {
    id: number
    serie: string
    numero: string
    cliente?: {
      id: number
      numero_documento: string
      razon_social?: string
      nombres?: string
      apellidos?: string
      direccion?: string
      telefono?: string
    }
  }
  despachador?: {
    id: string
    name: string
    numero_documento: string
  }
  productos_entregados?: ProductoEntregado[]
}

export interface ProductoEntregado {
  id: number
  entrega_producto_id: number
  unidad_derivada_venta_id: number
  cantidad_entregada: number
  ubicacion?: string
  createdAt: string
  updatedAt: string
  
  // Relación con producto
  unidad_derivada_venta?: {
    id: number
    producto?: {
      codigo: string
      descripcion: string
    }
    unidad_derivada?: {
      nombre: string
    }
  }
}

// ============= REQUEST TYPES =============

export interface GetEntregasParams {
  fecha_desde?: string
  fecha_hasta?: string
  estado_entrega?: EstadoEntrega
  tipo_despacho?: TipoDespacho
  search?: string
  despachador_id?: string
}

export interface UpdateEstadoEntregaRequest {
  estado_entrega: EstadoEntrega
  observaciones?: string
}

// ============= RESPONSE TYPES =============

export interface EntregaResponse {
  success: boolean
  data: Entrega
  message?: string
}

export interface EntregasListResponse {
  success: boolean
  data: Entrega[]
  message?: string
}

// ============= API FUNCTIONS =============

export const entregasApi = {
  // Obtener todas las entregas
  getAll: async (params?: GetEntregasParams): Promise<ApiResponse<Entrega[]>> => {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })
    }
    
    const queryString = queryParams.toString()
    const url = queryString ? `/entregas?${queryString}` : '/entregas'
    
    return apiRequest<Entrega[]>(url, {
      method: 'GET',
    })
  },

  // Obtener una entrega por ID
  getById: async (id: number): Promise<ApiResponse<Entrega>> => {
    return apiRequest<Entrega>(`/entregas/${id}`, {
      method: 'GET',
    })
  },

  // Actualizar estado de entrega
  updateEstado: async (
    id: number,
    data: UpdateEstadoEntregaRequest
  ): Promise<ApiResponse<Entrega>> => {
    return apiRequest<Entrega>(`/entregas/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// NUEVO MÓDULO — endpoints reestructurados (nuevas tablas: entrega, entrega_detalle)
// ─────────────────────────────────────────────────────────────────────────────

export interface ResumenVenta {
  venta_id: string
  serie: string
  numero: number
  venta_numero: string
  fecha: string
  cliente_nombre: string
  cliente_numero_documento: string | null
  cliente_telefono: string | null
  total_entregas: number
  completadas: number
  en_camino: number
  pendientes: number
  canceladas: number
  proxima_fecha_programada: string | null
  ultima_fecha_ejecutada: string | null
  /** true si la venta no tiene ningún registro en `entrega` (ej: domicilio omitida) */
  sin_entregas: boolean
}

export interface EntregaDetalleProd {
  id: number
  unidad_derivada_venta_id: number
  cantidad: number
  ubicacion: string | null
  unidad: string | null
  factor: number | null
  cantidad_pendiente: number | null
  producto: { id: number; name: string; cod_producto: string } | null
}

export interface EntregaNueva {
  id: number
  venta_id: string
  venta_entrega_secuencia: number
  stock_aplicado: boolean
  tipo_entrega_codigo: 'rt' | 'de' | 'pa' | null
  tipo_entrega_nombre: string | null
  tipo_entrega_icono: string | null
  tipo_entrega_color: string | null
  tipo_despacho_codigo: 'in' | 'pr' | null
  tipo_despacho_nombre: string | null
  estado_entrega_codigo: 'pe' | 'ec' | 'en' | 'ca' | null
  estado_entrega_nombre: string | null
  estado_entrega_color: string | null
  es_final: boolean
  quien_entrega_codigo: 'almacen' | 'vendedor' | 'chofer' | null
  quien_entrega_nombre: string | null
  chofer_id: string | null
  chofer_name: string | null
  vehiculo_id: number | null
  vehiculo_placa: string | null
  vehiculo_name: string | null
  tipo_pedido: 'interno' | 'externo'
  cargo_destino: string | null
  fecha_creacion: string | null
  fecha_programada: string | null
  fecha_ejecutada: string | null
  hora_inicio: string | null
  hora_fin: string | null
  direccion_entrega: string | null
  referencia_entrega: string | null
  observaciones: string | null
  motivo_anulacion: string | null
  detalles: EntregaDetalleProd[]
  venta?: {
    id: string
    serie: string
    numero: string
    tipo_documento: string
    cliente?: {
      id: number
      razon_social?: string | null
      nombres?: string | null
      apellidos?: string | null
      telefono?: string | null
      numero_documento?: string | null
    } | null
  }
}

export interface PaginatedResult<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface FiltrosListarEntregas {
  fecha_desde?: string
  fecha_hasta?: string
  estado?: string | string[]
  tipo_entrega?: string
  chofer_id?: string
  vehiculo_id?: number | number[]
  vehiculo_ids?: number[]
  solo_programadas?: boolean
  search?: string
}

export interface FiltrosResumenVentas {
  fecha_desde?: string
  fecha_hasta?: string
  search?: string
  solo_con_pendientes?: boolean
  solo_sin_entregas?: boolean
  chofer_id?: string
  per_page?: number
  page?: number
}

export const entregasNuevasApi = {
  listar: (filtros: FiltrosListarEntregas = {}): Promise<ApiResponse<EntregaNueva[]>> => {
    const p = new URLSearchParams()
    if (filtros.fecha_desde) p.set('fecha_desde', filtros.fecha_desde)
    if (filtros.fecha_hasta) p.set('fecha_hasta', filtros.fecha_hasta)
    if (filtros.estado) {
      const estados = Array.isArray(filtros.estado) ? filtros.estado : [filtros.estado]
      estados.forEach(e => p.append('estado[]', e))
    }
    if (filtros.tipo_entrega) p.set('tipo_entrega', filtros.tipo_entrega)
    if (filtros.chofer_id)    p.set('chofer_id', filtros.chofer_id)
    // Soporta tanto un único ID como múltiples.
    // El front nuevo usa `vehiculo_ids` (plural, array) para el multi-select
    // del calendario. Mantenemos `vehiculo_id` por compat.
    const vehiculos = filtros.vehiculo_ids
      ?? (filtros.vehiculo_id !== undefined ? filtros.vehiculo_id : null)
    if (vehiculos !== null && vehiculos !== undefined) {
      const arr = Array.isArray(vehiculos) ? vehiculos : [vehiculos]
      arr.filter((v): v is number => v !== null && v !== undefined).forEach(v => p.append('vehiculo_id[]', String(v)))
    }
    if (filtros.solo_programadas !== undefined) p.set('solo_programadas', filtros.solo_programadas ? '1' : '0')
    if (filtros.search)       p.set('search', filtros.search)
    const qs = p.toString()
    return apiRequest(`/entregas${qs ? `?${qs}` : ''}`, { method: 'GET' })
  },

  resumenVentas: (filtros: FiltrosResumenVentas = {}): Promise<ApiResponse<PaginatedResult<ResumenVenta>>> => {
    const p = new URLSearchParams()
    if (filtros.fecha_desde) p.set('fecha_desde', filtros.fecha_desde)
    if (filtros.fecha_hasta) p.set('fecha_hasta', filtros.fecha_hasta)
    if (filtros.search) p.set('search', filtros.search)
    if (filtros.solo_con_pendientes) p.set('solo_con_pendientes', '1')
    if (filtros.solo_sin_entregas) p.set('solo_sin_entregas', '1')
    if (filtros.chofer_id) p.set('chofer_id', filtros.chofer_id)
    if (filtros.per_page) p.set('per_page', String(filtros.per_page))
    if (filtros.page) p.set('page', String(filtros.page))
    const qs = p.toString()
    return apiRequest(`/entregas/resumen-ventas${qs ? `?${qs}` : ''}`, { method: 'GET' })
  },

  porVenta: (ventaId: string): Promise<ApiResponse<EntregaNueva[]>> =>
    apiRequest(`/entregas/por-venta/${ventaId}`, { method: 'GET' }),

  reporte: (filtros: { fecha_desde?: string; fecha_hasta?: string; estado?: string; tipo_entrega?: string; per_page?: number } = {}) => {
    const p = new URLSearchParams()
    if (filtros.fecha_desde) p.set('fecha_desde', filtros.fecha_desde)
    if (filtros.fecha_hasta) p.set('fecha_hasta', filtros.fecha_hasta)
    if (filtros.estado) p.set('estado', filtros.estado)
    if (filtros.tipo_entrega) p.set('tipo_entrega', filtros.tipo_entrega)
    if (filtros.per_page) p.set('per_page', String(filtros.per_page))
    const qs = p.toString()
    return apiRequest<{ data: any[]; resumen: any; total: number }>(`/entregas/reporte${qs ? `?${qs}` : ''}`)
  },

  obtener: (id: number): Promise<ApiResponse<EntregaNueva>> =>
    apiRequest(`/entregas/${id}`, { method: 'GET' }),

  confirmar: (id: number): Promise<ApiResponse<EntregaNueva>> =>
    apiRequest(`/entregas/${id}/confirmar`, { method: 'POST' }),

  enCamino: (id: number): Promise<ApiResponse<EntregaNueva>> =>
    apiRequest(`/entregas/${id}/en-camino`, { method: 'POST' }),

  anular: (id: number, motivo: string): Promise<ApiResponse<EntregaNueva>> =>
    apiRequest(`/entregas/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify({ motivo }),
    }),

  aceptarPedido: (id: number): Promise<ApiResponse<EntregaNueva>> =>
    apiRequest(`/entregas/${id}/aceptar-pedido`, { method: 'POST' }),

  reasignarChofer: (
    id: number,
    choferId: string,
    vehiculoId?: number | null
  ): Promise<ApiResponse<EntregaNueva>> =>
    apiRequest(`/entregas/${id}/reasignar-chofer`, {
      method: 'POST',
      body: JSON.stringify({ chofer_id: choferId, vehiculo_id: vehiculoId }),
    }),

  crear: (data: {
    venta_id: string
    tipo_entrega: string
    tipo_despacho: string
    quien_entrega: string
    almacen_salida_id: number
    chofer_id?: string | null
    vehiculo_id?: number | null
    tipo_pedido: string
    cargo_destino?: string | null
    fecha_programada?: string | null
    hora_inicio?: string | null
    hora_fin?: string | null
    direccion_entrega?: string | null
    referencia_entrega?: string | null
    latitud?: number | null
    longitud?: number | null
    observaciones?: string | null
    productos: Array<{ unidad_derivada_venta_id: number; cantidad: number }>
    user_creador_id: string
  }): Promise<ApiResponse<EntregaNueva>> =>
    apiRequest('/entregas', { method: 'POST', data }),
}
