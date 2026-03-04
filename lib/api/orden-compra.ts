import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface OrdenCompraProducto {
    id: number;
    orden_compra_id: number;
    producto_id: number;
    codigo: string | null;
    nombre: string | null;
    marca: string | null;
    unidad: string | null;
    cantidad: number;
    precio: number;
    subtotal: number;
    flete: number;
    vencimiento: string | null;
    lote: string | null;
}

export interface OrdenCompra {
    id: number;
    codigo: string;
    requerimiento_id: number | null;
    proveedor_id: number | null;
    fecha: string;
    tipo_moneda: 's' | 'd';
    tipo_de_cambio: number;
    ruc: string | null;
    tipo_documento: string | null;
    serie: string | null;
    numero: string | null;
    guia: string | null;
    percepcion: number;
    forma_de_pago: 'co' | 'cr';
    numero_dias: number | null;
    fecha_vencimiento: string | null;
    egreso_dinero_id: string | null;
    despliegue_de_pago_id: string | null;
    estado: 'pendiente' | 'en_proceso' | 'completada' | 'anulada';
    user_id: string;
    almacen_id: number;
    created_at: string;
    updated_at: string;
    total?: number;
    productos_count?: number;
    productos?: OrdenCompraProducto[];
    proveedor?: { id: number; razon_social: string; ruc: string };
    user?: { id: string; name: string };
    requerimiento?: {
        id: number;
        codigo: string;
        titulo: string;
        area: string;
        prioridad: string;
    };
}

// ============= REQUEST TYPES =============

export interface CreateOrdenCompraProductoRequest {
    producto_id: number;
    codigo?: string;
    nombre?: string;
    marca?: string;
    unidad?: string;
    cantidad: number;
    precio: number;
    subtotal: number;
    flete?: number;
    vencimiento?: string;
    lote?: string;
}

export interface CreateOrdenCompraRequest {
    requerimiento_id?: number;
    proveedor_id?: number;
    fecha: string; // YYYY-MM-DD
    tipo_moneda?: 's' | 'd';
    tipo_de_cambio?: number;
    ruc?: string;
    tipo_documento?: string;
    serie?: string;
    numero?: string;
    guia?: string;
    percepcion?: number;
    forma_de_pago?: 'co' | 'cr';
    numero_dias?: number;
    fecha_vencimiento?: string;
    egreso_dinero_id?: string;
    despliegue_de_pago_id?: string;
    almacen_id: number;
    productos: CreateOrdenCompraProductoRequest[];
}

export interface OrdenCompraFilters {
    estado?: string;
    almacen_id?: number;
    proveedor_id?: number;
    requerimiento_id?: number;
    desde?: string;
    hasta?: string;
    search?: string;
    per_page?: number;
    page?: number;
}

// ============= RESPONSE TYPES =============

export interface OrdenCompraResponse {
    data: OrdenCompra;
    message?: string;
}

export interface OrdenesCompraListResponse {
    data: OrdenCompra[];
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total: number;
}

// ============= API METHODS =============

export const ordenCompraApi = {
    /**
     * Listar órdenes de compra con filtros
     */
    getAll: async (filters?: OrdenCompraFilters): Promise<ApiResponse<OrdenesCompraListResponse>> => {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, String(value));
                }
            });
        }
        const queryString = params.toString();
        const url = queryString ? `/ordenes-compra?${queryString}` : '/ordenes-compra';
        return apiRequest<OrdenesCompraListResponse>(url);
    },

    /**
     * Obtener orden de compra por ID
     */
    getById: async (id: number): Promise<ApiResponse<OrdenCompraResponse>> => {
        return apiRequest<OrdenCompraResponse>(`/ordenes-compra/${id}`);
    },

    /**
     * Crear orden de compra
     */
    create: async (data: CreateOrdenCompraRequest): Promise<ApiResponse<OrdenCompraResponse>> => {
        return apiRequest<OrdenCompraResponse>('/ordenes-compra', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Anular orden de compra
     */
    anular: async (id: number): Promise<ApiResponse<OrdenCompraResponse>> => {
        return apiRequest<OrdenCompraResponse>(`/ordenes-compra/${id}/anular`, {
            method: 'PATCH',
        });
    },

    /**
     * Aprobar orden de compra
     */
    aprobar: async (id: number): Promise<ApiResponse<OrdenCompraResponse>> => {
        return apiRequest<OrdenCompraResponse>(`/ordenes-compra/${id}/aprobar`, {
            method: 'PATCH',
        });
    },
};
