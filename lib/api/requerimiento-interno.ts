import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface RequerimientoInternoProducto {
    id: number;
    requerimiento_id: number;
    producto_id: number;
    cantidad: number;
    unidad: string | null;
    producto?: {
        id: number;
        cod_producto: string;
        name: string;
        marca?: { id: number; name: string };
        unidad_medida?: { id: number; name: string };
    };
}

export interface RequerimientoInternoServicio {
    id: number;
    requerimiento_id: number;
    tipo_servicio: string | null;
    descripcion_servicio: string;
    lugar_ejecucion: string | null;
    fecha_inicio_estimada: string | null;
    presupuesto_referencial: number | null;
    duracion_cantidad: number | null;
    duracion_unidad: string | null;
}

export interface RequerimientoInterno {
    id: number;
    codigo: string;
    titulo: string;
    area: string;
    fecha_requerida: string;
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    tipo_solicitud: 'OC' | 'OS';
    observaciones: string | null;
    estado: 'pendiente' | 'aprobado' | 'rechazado' | 'anulado';
    proveedor_sugerido_id: number | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    productos?: RequerimientoInternoProducto[];
    servicio?: RequerimientoInternoServicio;
    user?: { id: string; name: string };
    proveedor_sugerido?: { id: number; razon_social: string; ruc: string };
}

// ============= REQUEST TYPES =============

export interface CreateRequerimientoProductoRequest {
    producto_id: number;
    cantidad: number;
    unidad?: string;
}

export interface CreateRequerimientoServicioRequest {
    tipo_servicio?: string;
    descripcion_servicio: string;
    lugar_ejecucion?: string;
    fecha_inicio_estimada?: string;
    presupuesto_referencial?: number;
    duracion_cantidad?: number;
    duracion_unidad?: string;
}

export interface CreateRequerimientoRequest {
    titulo: string;
    area: string;
    fecha_requerida: string; // YYYY-MM-DD
    prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    tipo_solicitud: 'OC' | 'OS';
    observaciones?: string;
    proveedor_sugerido_id?: number;
    // Para OC
    productos?: CreateRequerimientoProductoRequest[];
    // Para OS
    servicio?: CreateRequerimientoServicioRequest;
}

export interface UpdateEstadoRequest {
    estado: 'pendiente' | 'aprobado' | 'rechazado' | 'anulado';
}

export interface RequerimientoFilters {
    estado?: string;
    tipo_solicitud?: string;
    area?: string;
    prioridad?: string;
    desde?: string;
    hasta?: string;
    search?: string;
    per_page?: number;
    page?: number;
}

// ============= RESPONSE TYPES =============

export interface RequerimientoResponse {
    data: RequerimientoInterno;
    message?: string;
}

export interface RequerimientosListResponse {
    data: RequerimientoInterno[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total: number;
}

// ============= API METHODS =============

export const requerimientoInternoApi = {
    /**
     * Listar requerimientos con filtros
     */
    getAll: async (filters?: RequerimientoFilters): Promise<ApiResponse<RequerimientosListResponse>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        const queryString = params.toString();
        const url = queryString ? `/requerimientos-internos?${queryString}` : '/requerimientos-internos';
        return apiRequest<RequerimientosListResponse>(url);
    },

    /**
     * Obtener solo requerimientos aprobados de tipo OC (para el modal de solicitudes)
     */
    getAprobadosOC: async (): Promise<ApiResponse<RequerimientosListResponse>> => {
        return apiRequest<RequerimientosListResponse>('/requerimientos-internos?estado=aprobado,pendiente&tipo_solicitud=OC&per_page=100');
    },

    /**
     * Obtener requerimiento por ID
     */
    getById: async (id: number): Promise<ApiResponse<RequerimientoResponse>> => {
        return apiRequest<RequerimientoResponse>(`/requerimientos-internos/${id}`);
    },

    /**
     * Crear requerimiento
     */
    create: async (data: CreateRequerimientoRequest): Promise<ApiResponse<RequerimientoResponse>> => {
        return apiRequest<RequerimientoResponse>('/requerimientos-internos', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Actualizar estado (aprobar, rechazar, anular)
     */
    updateEstado: async (id: number, data: UpdateEstadoRequest): Promise<ApiResponse<RequerimientoResponse>> => {
        return apiRequest<RequerimientoResponse>(`/requerimientos-internos/${id}/estado`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },
};
