/**
 * API Client para Ventas (Laravel Backend)
 */

import { apiRequest, type ApiResponse } from '../api';

// ============= ENUMS =============

export enum TipoDocumento {
  FACTURA = '01',
  BOLETA = '03',
  NOTA_DE_VENTA = 'nv',
}

export enum FormaDePago {
  CONTADO = 'co',
  CREDITO = 'cr',
}

export enum TipoMoneda {
  SOLES = 's',
  DOLARES = 'd',
}

export enum EstadoDeVenta {
  EN_ESPERA = 'ee',
  CREADO = 'cr',
  PROCESADO = 'pr',
  ANULADO = 'an',
}

export enum DescuentoTipo {
  PORCENTAJE = '%',
  MONTO = 'm',
}

// ============= INTERFACES =============

export interface ProductoVentaRequest {
  producto_id?: number;
  producto_almacen_id?: number;
  costo: number;
  unidades_derivadas: UnidadDerivadaVentaRequest[];
}

export interface UnidadDerivadaVentaRequest {
  unidad_derivada_inmutable_id?: number;
  unidad_derivada_inmutable_name?: string;
  factor: number;
  cantidad: number;
  cantidad_pendiente: number;
  precio: number;
  recargo?: number;
  descuento_tipo?: '%' | 'm' | null;
  descuento?: number;
  comision?: number;
}

export interface DespliegueDePagoVentaRequest {
  despliegue_de_pago_id: string;
  monto: number;
  numero_operacion?: string;
}

export interface CreateVentaRequest {
  id?: string;
  tipo_documento: TipoDocumento;
  serie?: string; // Opcional: Se genera automáticamente en el backend
  numero?: number; // Opcional: Se genera automáticamente en el backend
  descripcion?: string;
  forma_de_pago: FormaDePago;
  tipo_moneda: TipoMoneda;
  tipo_de_cambio?: number;
  fecha: string;
  estado_de_venta: EstadoDeVenta;
  cliente_id?: number; // Opcional: Para Boleta/NV sin cliente, backend usa "CLIENTE VARIOS" automáticamente
  direccion_seleccionada?: 'D1' | 'D2' | 'D3' | 'D4'; // Dirección seleccionada del cliente
  recomendado_por_id?: number;
  user_id: string;
  almacen_id: number;
  productos_por_almacen: ProductoVentaRequest[];
  despliegue_de_pago_ventas?: DespliegueDePagoVentaRequest[];
  ingreso_dinero_id?: string;
}

export interface UpdateVentaRequest extends Partial<CreateVentaRequest> {}

export interface VentaFilters {
  almacen_id?: number;
  estado_de_venta?: EstadoDeVenta;
  cliente_id?: number;
  tipo_documento?: TipoDocumento;
  search?: string;
  entrega?: 'pendiente' | 'completa';
  per_page?: number;
  page?: number;
}

// ============= RESPONSE TYPES =============

export interface VentaResponse {
  data: any; // TODO: Definir interfaz completa de Venta
  message?: string;
}

export interface VentasListResponse {
  data: any[]; // TODO: Definir interfaz completa de Venta
  total: number;
  current_page: number;
  per_page: number;
  last_page: number;
}

// ============= API METHODS =============

export const ventaApi = {
  /**
   * Listar ventas con filtros
   */
  async list(filters?: VentaFilters): Promise<ApiResponse<VentasListResponse>> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/ventas?${queryString}` : '/ventas';

    return apiRequest<VentasListResponse>(url);
  },

  /**
   * Obtener una venta por ID
   */
  async getById(id: string): Promise<ApiResponse<VentaResponse>> {
    return apiRequest<VentaResponse>(`/ventas/${id}`);
  },

  /**
   * Crear una nueva venta
   */
  async create(data: CreateVentaRequest): Promise<ApiResponse<VentaResponse>> {
    return apiRequest<VentaResponse>('/ventas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Actualizar una venta
   */
  async update(id: string, data: UpdateVentaRequest): Promise<ApiResponse<VentaResponse>> {
    return apiRequest<VentaResponse>(`/ventas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Anular una venta
   */
  async anular(id: string): Promise<ApiResponse<{ data: string; message: string }>> {
    return apiRequest<{ data: string; message: string }>(`/ventas/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============= TIPOS ADICIONALES =============

/**
 * Tipo para venta completa con todas sus relaciones
 * (usado en tablas y modales de mis-ventas)
 */
export type VentaCompleta = {
  id: string
  tipo_documento: string
  serie: string
  numero: number
  descripcion?: string
  forma_de_pago: 'co' | 'cr'
  tipo_moneda: 's' | 'd'
  tipo_de_cambio: number
  fecha: string
  estado_de_venta: 'cr' | 'ee' | 'pr' | 'an'
  cliente_id?: number
  direccion_seleccionada?: string
  recomendado_por_id?: number
  user_id: string
  almacen_id: number
  created_at: string
  updated_at: string
  total_pagado?: number
  entregas_productos_count?: number
  cliente?: any
  recomendadoPor?: any
  productos_por_almacen?: any[]
  despliegueDePagoVentas?: any[]
  user?: { id: string; name: string }
  almacen?: { id: number; name: string }
  entregasProductos?: any[]
  comprobante_electronico?: {
    id: number
    tipo_comprobante: string
    serie: string
    correlativo: number
    numero: string
    fecha_emision: string
    estado_sunat: string
    xml_path?: string
    xml_firmado?: string
    cdr_path?: string
    pdf_path?: string
    tiene_xml?: boolean
    tiene_cdr?: boolean
    moneda?: 'PEN' | 'USD'
    subtotal?: number
    igv?: number
    total?: number
  }
}

/**
 * Alias para compatibilidad con código existente
 * @deprecated Usar VentaCompleta en su lugar
 */
export type getVentaResponseProps = VentaCompleta
