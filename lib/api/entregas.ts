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
