import { apiRequest, type ApiResponse } from '../api';

// ============= ENUMS =============

export enum TipoOperacion {
  PRESTAR = 'PRESTAR',
  PEDIR_PRESTADO = 'PEDIR_PRESTADO'
}

export enum TipoEntidad {
  CLIENTE = 'CLIENTE',
  PROVEEDOR = 'PROVEEDOR'
}

export enum EstadoPrestamo {
  PENDIENTE = 'pendiente',
  PAGADO_PARCIAL = 'pagado_parcial',
  PAGADO_TOTAL = 'pagado_total',
  VENCIDO = 'vencido'
}

export enum TipoInteres {
  SIMPLE = 'SIMPLE',
  COMPUESTO = 'COMPUESTO'
}

export enum TipoMoneda {
  SOLES = 's',
  DOLARES = 'd'
}

// ============= INTERFACES =============

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

export interface Proveedor {
  id: number;
  razon_social: string;
  numero_documento: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface User {
  id: string;
  name: string;
}

export interface Almacen {
  id: number;
  name: string;
}

export interface Marca {
  id: number;
  name: string;
}

export interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  marca?: Marca;
}

export interface ProductoAlmacen {
  id: number;
  producto_id: number;
  almacen_id: number;
  stock_fraccion: number;
  costo: number;
  producto?: Producto;
}

export interface UnidadDerivadaInmutablePrestamo {
  id: number;
  name: string;
  factor: number;
  cantidad: number;
  producto_almacen_prestamo_id: number;
  unidad_derivada_id: number;
}

export interface ProductoAlmacenPrestamo {
  id: number;
  prestamo_id: string;
  costo: number;
  producto_almacen_id: number;
  productoAlmacen?: ProductoAlmacen;
  unidadesDerivadas?: UnidadDerivadaInmutablePrestamo[];
}

export interface PagoPrestamo {
  id: string;
  prestamo_id: string;
  numero_pago: string;
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  numero_operacion?: string;
  observaciones?: string;
  user_id: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

export interface Prestamo {
  id: string;
  numero: string;
  fecha: string;
  fecha_vencimiento: string;
  tipo_operacion: TipoOperacion;
  tipo_entidad: TipoEntidad;
  cliente_id?: number;
  proveedor_id?: number;
  ruc_dni?: string;
  telefono?: string;
  direccion?: string;
  tipo_moneda: TipoMoneda;
  tipo_de_cambio: number;
  monto_total: number;
  monto_pagado: number;
  monto_pendiente: number;
  tasa_interes?: number;
  tipo_interes?: TipoInteres;
  dias_gracia?: number;
  garantia?: string;
  estado_prestamo: EstadoPrestamo;
  observaciones?: string;
  user_id: string;
  vendedor?: string;
  almacen_id: number;
  created_at: string;
  updated_at: string;
  // Relaciones
  cliente?: Cliente;
  proveedor?: Proveedor;
  user?: User;
  almacen?: Almacen;
  productosPorAlmacen?: ProductoAlmacenPrestamo[];
  pagos?: PagoPrestamo[];
}

// ============= REQUEST TYPES =============

export interface ProductoPrestamoRequest {
  producto_id: number;
  unidad_derivada_id: number;
  unidad_derivada_factor: number;
  cantidad: number;
  costo?: number; // Opcional: Solo se maneja por cantidad
}

export interface CreatePrestamoRequest {
  productos: ProductoPrestamoRequest[];
  fecha: string;
  fecha_vencimiento: string;
  tipo_operacion: TipoOperacion;
  tipo_entidad: TipoEntidad;
  tipo_moneda: TipoMoneda;
  tipo_de_cambio?: number;
  cliente_id?: number;
  proveedor_id?: number;
  ruc_dni?: string;
  telefono?: string;
  direccion?: string;
  monto_total: number;
  tasa_interes?: number;
  tipo_interes?: TipoInteres;
  dias_gracia?: number;
  garantia?: string;
  observaciones?: string;
  vendedor?: string;
  almacen_id: number;
}

export interface CreatePagoRequest {
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  numero_operacion?: string;
  observaciones?: string;
}

export interface PrestamoFilters {
  estado_prestamo?: EstadoPrestamo;
  tipo_operacion?: TipoOperacion;
  tipo_entidad?: TipoEntidad;
  almacen_id?: number;
  cliente_id?: number;
  proveedor_id?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  search?: string;
  per_page?: number;
}

// ============= RESPONSE TYPES =============

export interface PrestamoResponse {
  data: Prestamo;
}

export interface PrestamosListResponse {
  data: Prestamo[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CreatePrestamoResponse {
  data: Prestamo;
  message: string;
}

export interface PagoResponse {
  data: PagoPrestamo;
  prestamo: Prestamo;
  message: string;
}

export interface PagosListResponse {
  data: PagoPrestamo[];
}

export interface SiguienteNumeroResponse {
  numero: string;
}

// ============= API METHODS =============

export const prestamoApi = {
  // Listar préstamos con filtros
  getAll: async (filters?: PrestamoFilters): Promise<ApiResponse<PrestamosListResponse>> => {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/prestamos?${queryString}` : '/prestamos';

    return apiRequest<PrestamosListResponse>(url);
  },

  // Obtener préstamo por ID
  getById: async (id: string): Promise<ApiResponse<PrestamoResponse>> => {
    return apiRequest<PrestamoResponse>(`/prestamos/${id}`);
  },

  // Crear préstamo
  create: async (data: CreatePrestamoRequest): Promise<ApiResponse<CreatePrestamoResponse>> => {
    return apiRequest<CreatePrestamoResponse>('/prestamos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Eliminar préstamo
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiRequest<{ message: string }>(`/prestamos/${id}`, {
      method: 'DELETE',
    });
  },

  // Obtener siguiente número de préstamo
  getSiguienteNumero: async (): Promise<ApiResponse<SiguienteNumeroResponse>> => {
    return apiRequest<SiguienteNumeroResponse>('/prestamos/siguiente-numero/preview');
  },

  // ========= PAGOS =========

  // Listar pagos de un préstamo
  getPagos: async (prestamoId: string): Promise<ApiResponse<PagosListResponse>> => {
    return apiRequest<PagosListResponse>(`/prestamos/${prestamoId}/pagos`);
  },

  // Registrar pago
  registrarPago: async (prestamoId: string, data: CreatePagoRequest): Promise<ApiResponse<PagoResponse>> => {
    return apiRequest<PagoResponse>(`/prestamos/${prestamoId}/pagos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Eliminar pago
  eliminarPago: async (prestamoId: string, pagoId: string): Promise<ApiResponse<{ message: string; prestamo: Prestamo }>> => {
    return apiRequest<{ message: string; prestamo: Prestamo }>(`/prestamos/${prestamoId}/pagos/${pagoId}`, {
      method: 'DELETE',
    });
  },
};
