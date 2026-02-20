import { apiRequest, type ApiResponse } from '../api';

// ============= INTERFACES =============

export interface UnidadDerivadaInmutableCompra {
  id: number;
  unidad_derivada_inmutable_id: number;
  producto_almacen_compra_id: number;
  factor: number;
  cantidad: number;
  cantidad_pendiente: number;
  lote: string | null;
  vencimiento: string | null; // ISO date string
  flete: number;
  bonificacion: boolean;
  unidad_derivada_inmutable?: {
    id: number;
    name: string;
  };
}

export interface ProductoAlmacenCompra {
  id: number;
  compra_id: string;
  costo: number;
  producto_almacen_id: number;
  producto_almacen?: {
    id: number;
    producto: {
      id: number;
      name: string;
      cod_producto: string;
      marca?: {
        id: number;
        name: string;
      };
      unidad_medida?: {
        id: number;
        name: string;
      };
    };
  };
  unidades_derivadas?: UnidadDerivadaInmutableCompra[];
}

export interface Compra {
  id: string;
  tipo_documento: string;
  serie: string | null;
  numero: number | null;
  descripcion: string | null;
  forma_de_pago: string;
  tipo_moneda: string;
  tipo_de_cambio: number | null;
  percepcion: number | null;
  numero_dias: number | null;
  fecha_vencimiento: string | null; // ISO date string
  fecha: string; // ISO date string
  guia: string | null;
  estado_de_compra: string;
  egreso_dinero_id: string | null;
  despliegue_de_pago_id: number | null;
  user_id: string;
  almacen_id: number;
  proveedor_id: number;
  created_at: string;
  updated_at: string;
  proveedor?: {
    id: number;
    ruc: string;
    razon_social: string;
  };
  productos_por_almacen?: ProductoAlmacenCompra[];
  user?: {
    id: string;
    name: string;
  };
  recepciones_almacen_count?: number;
  pagos_de_compras_count?: number;
  total_pagado?: number;
}

// ============= REQUEST TYPES =============

export interface CreateUnidadDerivadaInmutableCompraRequest {
  unidad_derivada_inmutable_id?: number; // Optional - can use unidad_derivada_inmutable_name instead
  unidad_derivada_inmutable_name?: string; // Optional - alternative to unidad_derivada_inmutable_id
  factor: number;
  cantidad: number;
  cantidad_pendiente: number;
  lote?: string | null;
  vencimiento?: string | null; // ISO date string
  flete?: number;
  bonificacion?: boolean;
}

export interface CreateProductoAlmacenCompraRequest {
  costo: number;
  producto_almacen_id?: number; // Optional - can use producto_id instead
  producto_id?: number; // Optional - alternative to producto_almacen_id
  unidades_derivadas: CreateUnidadDerivadaInmutableCompraRequest[];
}

export interface CreateCompraRequest {
  id?: string; // Optional - backend generates if not provided
  tipo_documento: string; // TipoDocumento enum as string
  serie?: string | null;
  numero?: number | null;
  descripcion?: string | null;
  forma_de_pago: string; // FormaDePago enum as string
  tipo_moneda: string; // TipoMoneda enum as string
  tipo_de_cambio?: number | null;
  percepcion?: number | null;
  numero_dias?: number | null;
  fecha_vencimiento?: string | null; // ISO date string
  fecha: string; // ISO date string
  guia?: string | null;
  estado_de_compra: string; // EstadoDeCompra enum as string
  egreso_dinero_id?: string | null;
  despliegue_de_pago_id?: number | null;
  user_id: string;
  almacen_id: number;
  proveedor_id: number;
  productos_por_almacen: CreateProductoAlmacenCompraRequest[];
}

export interface UpdateCompraRequest extends Partial<Omit<CreateCompraRequest, 'id'>> { }

// ============= PAGO DE COMPRA TYPES =============

export interface PagoDeCompra {
  id: string; // ULID
  compra_id: string;
  despliegue_de_pago_id: string; // ULID
  monto: number;
  fecha: string; // ISO date string
  observacion: string | null;
  numero_letra: string | null;
  numero_operacion: string | null;
  estado: boolean;
  created_at?: string;
  despliegue_de_pago?: {
    id: string; // ULID
    numero_celular: string;
    metodo_de_pago?: {
      id: string; // ULID
      name: string;
      cuenta_bancaria: string | null;
    };
  };
}

export interface CreatePagoCompraRequest {
  despliegue_de_pago_id: string; // ULID
  monto: number;
  fecha: string; // ISO date string
  observacion?: string | null;
  afecta_caja: boolean;
  numero_operacion?: string | null;
  numero_letra?: string | null;
}

export interface CompraFilters {
  almacen_id?: number;
  estado_de_compra?: string; // EstadoDeCompra enum value
  proveedor_id?: number;
  forma_de_pago?: string; // FormaDePago enum value
  tipo_documento?: string; // TipoDocumento enum value
  user_id?: string;
  desde?: string; // ISO date string (YYYY-MM-DD)
  hasta?: string; // ISO date string (YYYY-MM-DD)
  search?: string;
  per_page?: number;
  page?: number;
}

// ============= UPDATE LOTES Y VENCIMIENTOS =============

export interface UpdateLoteVencimientoRequest {
  id: number; // ID de la unidad derivada inmutable compra
  lote?: string | null;
  vencimiento?: string | null; // ISO date string
}

export interface UpdateLotesVencimientosRequest {
  unidades_derivadas: UpdateLoteVencimientoRequest[];
}

// ============= RESPONSE TYPES =============

export interface CompraResponse {
  data: Compra;
  message?: string;
}

export interface ComprasListResponse {
  data: Compra[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total: number;
}

// ============= REPORTE TYPES =============

export interface CompraResumenMensual {
  mes: string; // '2025-01'
  total: number;
  cantidad: number;
}

export interface CompraResumen {
  total_compras: number;
  total_transacciones: number;
  total_contado: number;
  total_credito: number;
  total_pagado: number;
  saldo_pendiente: number;
}

export interface CompraReporteItem {
  id: string;
  fecha: string;
  tipo_documento: string;
  serie: string | null;
  numero: number | null;
  proveedor_ruc: string;
  proveedor_nombre: string;
  total: number;
  forma_de_pago: string;
  estado_de_compra: string;
  total_pagado: number;
  saldo: number;
}

export interface CompraReporteResponse {
  data: CompraReporteItem[];
  resumen: {
    total: number;
    total_pagado: number;
    saldo: number;
    cantidad: number;
  };
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CompraReporteFilters {
  almacen_id?: number;
  desde?: string;
  hasta?: string;
  proveedor_id?: number;
  forma_de_pago?: string;
  estado_de_compra?: string;
  per_page?: number;
  page?: number;
}

// ============= API METHODS =============

export const compraApi = {
  /**
   * Listar compras con filtros
   */
  getAll: async (filters?: CompraFilters): Promise<ApiResponse<ComprasListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/compras?${queryString}` : '/compras';

    return apiRequest<ComprasListResponse>(url);
  },

  /**
   * Listar compras por pagar (crédito con saldo pendiente)
   */
  getComprasPorPagar: async (filters?: Omit<CompraFilters, 'forma_de_pago' | 'estado_de_compra'>): Promise<ApiResponse<ComprasListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/compras/por-pagar?${queryString}` : '/compras/por-pagar';

    return apiRequest<ComprasListResponse>(url);
  },

  /**
   * Obtener compra por ID
   */
  getById: async (id: string): Promise<ApiResponse<CompraResponse>> => {
    return apiRequest<CompraResponse>(`/compras/${id}`);
  },

  /**
   * Crear compra
   */
  create: async (data: CreateCompraRequest): Promise<ApiResponse<CompraResponse>> => {
    return apiRequest<CompraResponse>('/compras', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar compra (editar)
   */
  update: async (id: string, data: UpdateCompraRequest): Promise<ApiResponse<CompraResponse>> => {
    return apiRequest<CompraResponse>(`/compras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar compra (anular)
   */
  delete: async (id: string): Promise<ApiResponse<{ data: string }>> => {
    return apiRequest<{ data: string }>(`/compras/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Obtener pagos de una compra
   */
  getPagos: async (id: string): Promise<ApiResponse<{ data: PagoDeCompra[] }>> => {
    return apiRequest<{ data: PagoDeCompra[] }>(`/compras/${id}/pagos`);
  },

  /**
   * Registrar pago de compra
   */
  storePago: async (id: string, data: CreatePagoCompraRequest): Promise<ApiResponse<{ data: PagoDeCompra; message: string }>> => {
    return apiRequest<{ data: PagoDeCompra; message: string }>(`/compras/${id}/pagos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar lotes y vencimientos de unidades derivadas
   */
  updateLotesVencimientos: async (id: string, data: UpdateLotesVencimientosRequest): Promise<ApiResponse<CompraResponse>> => {
    return apiRequest<CompraResponse>(`/compras/${id}/lotes-vencimientos`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // ============= REPORTES =============

  getResumenMensual: async (filters?: CompraReporteFilters): Promise<ApiResponse<{ data: CompraResumenMensual[] }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/compras/resumen-mensual?${queryString}` : '/compras/resumen-mensual';
    return apiRequest<{ data: CompraResumenMensual[] }>(url);
  },

  getResumen: async (filters?: CompraReporteFilters): Promise<ApiResponse<{ data: CompraResumen }>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/compras/resumen?${queryString}` : '/compras/resumen';
    return apiRequest<{ data: CompraResumen }>(url);
  },

  getReporte: async (filters?: CompraReporteFilters): Promise<ApiResponse<CompraReporteResponse>> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString ? `/compras/reporte?${queryString}` : '/compras/reporte';
    return apiRequest<CompraReporteResponse>(url);
  },
};
