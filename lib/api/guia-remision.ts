/**
 * API Client para Guías de Remisión (Laravel Backend)
 */

import { apiRequest, type ApiResponse } from '../api';

// ============= ENUMS =============

export enum TipoGuia {
  ELECTRONICA_REMITENTE = 'ELECTRONICA_REMITENTE',
  ELECTRONICA_TRANSPORTISTA = 'ELECTRONICA_TRANSPORTISTA',
  FISICA = 'FISICA',
}

export enum ModalidadTransporte {
  PRIVADO = 'PRIVADO',
  PUBLICO = 'PUBLICO',
}

export enum EstadoGuia {
  BORRADOR = 'BORRADOR',
  EMITIDA = 'EMITIDA',
  ANULADA = 'ANULADA',
}

export enum EstadoSunat {
  PENDIENTE = 'PENDIENTE',
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
  OBSERVADO = 'OBSERVADO',
}

// ============= INTERFACES =============

export interface DetalleGuiaRequest {
  producto_id: number;
  producto_almacen_id: number;
  unidad_derivada_inmutable_id: number;
  unidad_derivada_inmutable_name: string;
  factor: number;
  cantidad: number;
  peso_total?: number;
  unidad_derivada_venta_id?: number;
}

export interface CreateGuiaRemisionRequest {
  venta_id?: string;
  tipo_guia: TipoGuia;
  serie?: string;
  numero?: number;
  fecha_emision: string; // Format: "YYYY-MM-DD"
  fecha_traslado: string; // Format: "YYYY-MM-DD"
  afecta_stock: boolean;
  cliente_id?: number;
  motivo_traslado_id: number;
  modalidad_transporte: ModalidadTransporte;
  vehiculo_placa?: string;
  chofer_id?: number;
  punto_partida: string;
  punto_llegada: string;
  almacen_origen_id: number;
  almacen_destino_id?: number;
  referencia?: string;
  observaciones?: string;
  user_id: string;
  detalles: DetalleGuiaRequest[];
}

export interface UpdateGuiaRemisionRequest {
  tipo_guia?: TipoGuia;
  serie?: string;
  numero?: number;
  fecha_emision?: string;
  fecha_traslado?: string;
  afecta_stock?: boolean;
  cliente_id?: number;
  motivo_traslado_id?: number;
  modalidad_transporte?: ModalidadTransporte;
  vehiculo_placa?: string;
  chofer_id?: number;
  punto_partida?: string;
  punto_llegada?: string;
  almacen_origen_id?: number;
  almacen_destino_id?: number;
  referencia?: string;
  observaciones?: string;
}

export interface AnularGuiaRemisionRequest {
  motivo_anulacion: string;
}

export interface GuiaRemisionFilters {
  venta_id?: string;
  cliente_id?: number;
  almacen_origen_id?: number;
  almacen_destino_id?: number;
  tipo_guia?: TipoGuia;
  estado?: EstadoGuia;
  motivo_traslado_id?: number;
  modalidad_transporte?: ModalidadTransporte;
  fecha_emision_desde?: string;
  fecha_emision_hasta?: string;
  fecha_traslado_desde?: string;
  fecha_traslado_hasta?: string;
  search?: string;
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface MotivoTraslado {
  id: number;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export interface Chofer {
  id: number;
  dni: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
}

export interface Almacen {
  id: number;
  name: string;
  direccion?: string;
}

export interface Cliente {
  id: number;
  tipo_cliente: string;
  numero_documento: string;
  nombres?: string;
  apellidos?: string;
  razon_social?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface Producto {
  id: number;
  cod_producto: string;
  name: string;
  marca?: {
    id: number;
    name: string;
  };
  unidadMedida?: {
    id: number;
    name: string;
  };
}

export interface DetalleGuia {
  id: number;
  guia_remision_id: string;
  producto_id: number;
  producto_almacen_id: number;
  unidad_derivada_inmutable_id: number;
  unidad_derivada_inmutable_name: string;
  factor: number;
  cantidad: number;
  peso_total?: number;
  unidad_derivada_venta_id?: number;
  producto?: Producto;
  unidadDerivadaInmutable?: {
    id: number;
    name: string;
  };
}

export interface GuiaRemision {
  id: string;
  venta_id?: string;
  tipo_guia: TipoGuia;
  serie?: string;
  numero?: number;
  fecha_emision: string;
  fecha_traslado: string;
  afecta_stock: boolean;
  cliente_id?: number;
  motivo_traslado_id: number;
  modalidad_transporte: ModalidadTransporte;
  vehiculo_placa?: string;
  chofer_id?: number;
  punto_partida: string;
  punto_llegada: string;
  almacen_origen_id: number;
  almacen_destino_id?: number;
  referencia?: string;
  observaciones?: string;
  estado: EstadoGuia;
  fecha_anulacion?: string;
  motivo_anulacion?: string;
  sunat_codigo_hash?: string;
  sunat_cdr_xml?: string;
  sunat_fecha_envio?: string;
  sunat_estado?: EstadoSunat;
  sunat_mensaje?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  
  // Relaciones
  venta?: {
    id: string;
    serie: string;
    numero: number;
    cliente?: Cliente;
  };
  cliente?: Cliente;
  motivoTraslado?: MotivoTraslado;
  chofer?: Chofer;
  almacenOrigen?: Almacen;
  almacenDestino?: Almacen;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  detalles?: DetalleGuia[];
}

export interface GuiaRemisionResponse {
  data: GuiaRemision;
  message?: string;
}

export interface GuiasRemisionListResponse {
  data: GuiaRemision[];
  total: number;
  current_page?: number;
  per_page?: number;
  last_page?: number;
}

// ============= API METHODS =============

export const guiaRemisionApi = {
  /**
   * Listar guías de remisión con filtros
   */
  async list(filters?: GuiaRemisionFilters): Promise<ApiResponse<GuiasRemisionListResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/guias-remision?${queryString}` : '/guias-remision';

    return apiRequest<GuiasRemisionListResponse>(url);
  },

  /**
   * Obtener una guía de remisión por ID
   */
  async getById(id: string): Promise<ApiResponse<GuiaRemisionResponse>> {
    return apiRequest<GuiaRemisionResponse>(`/guias-remision/${id}`);
  },

  /**
   * Crear una nueva guía de remisión
   */
  async create(data: CreateGuiaRemisionRequest): Promise<ApiResponse<GuiaRemisionResponse>> {
    return apiRequest<GuiaRemisionResponse>('/guias-remision', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar una guía de remisión (solo si está en BORRADOR)
   */
  async update(id: string, data: UpdateGuiaRemisionRequest): Promise<ApiResponse<GuiaRemisionResponse>> {
    return apiRequest<GuiaRemisionResponse>(`/guias-remision/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Emitir una guía (cambiar estado de BORRADOR a EMITIDA)
   */
  async emitir(id: string): Promise<ApiResponse<GuiaRemisionResponse>> {
    return apiRequest<GuiaRemisionResponse>(`/guias-remision/${id}/emitir`, {
      method: 'POST',
    });
  },

  /**
   * Anular una guía (cambiar estado de EMITIDA a ANULADA)
   */
  async anular(id: string, data: AnularGuiaRemisionRequest): Promise<ApiResponse<GuiaRemisionResponse>> {
    return apiRequest<GuiaRemisionResponse>(`/guias-remision/${id}/anular`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Eliminar una guía (solo si está en BORRADOR)
   */
  async delete(id: string): Promise<ApiResponse<{ data: string; message: string }>> {
    return apiRequest<{ data: string; message: string }>(`/guias-remision/${id}`, {
      method: 'DELETE',
    });
  },
};
