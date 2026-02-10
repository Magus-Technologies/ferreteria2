/**
 * API Client para Recepciones de Almacén (Laravel Backend)
 */

import { apiRequest, type ApiResponse } from '../api'

// ============= INTERFACES =============

export interface UnidadDerivadaRecepcionRequest {
  unidad_derivada_name: string
  factor: number
  cantidad: number
  lote?: string | null
  vencimiento?: string | null
  flete?: number
  bonificacion?: boolean
}

export interface ProductoRecepcionRequest {
  producto_id: number
  almacen_id: number
  costo: number
  unidades_derivadas: UnidadDerivadaRecepcionRequest[]
}

export interface CreateRecepcionAlmacenRequest {
  compra_id: string
  user_id: string
  fecha: string
  observaciones?: string
  transportista_razon_social?: string
  transportista_ruc?: string
  transportista_placa?: string
  transportista_licencia?: string
  transportista_dni?: string
  transportista_name?: string
  transportista_guia_remision?: string
  productos_por_almacen: ProductoRecepcionRequest[]
}

// ============= RESPONSE TYPES =============

export interface RecepcionAlmacenHistorial {
  id: number
  unidad_derivada_inmutable_recepcion_id: number
  stock_anterior: number
  stock_nuevo: number
}

export interface UnidadDerivadaInmutableResponse {
  id: number
  name: string
}

export interface UnidadDerivadaRecepcionResponse {
  id: number
  unidad_derivada_inmutable_id: number
  producto_almacen_recepcion_id: number
  factor: number
  cantidad: number
  cantidad_restante: number
  lote: string | null
  vencimiento: string | null
  flete: number
  bonificacion: boolean
  unidad_derivada_inmutable: UnidadDerivadaInmutableResponse
  historial: RecepcionAlmacenHistorial[]
}

export interface MarcaResponse {
  id: number
  name: string
}

export interface UnidadMedidaResponse {
  id: number
  name: string
}

export interface ProductoResponse {
  id: number
  name: string
  cod_producto: string
  unidades_contenidas: number
  marca_id: number
  marca: MarcaResponse
  unidad_medida: UnidadMedidaResponse
}

export interface ProductoAlmacenResponse {
  id: number
  producto_id: number
  almacen_id: number
  stock_fraccion: number
  costo: number
  producto: ProductoResponse
}

export interface ProductoAlmacenRecepcionResponse {
  id: number
  recepcion_id: number
  costo: number
  producto_almacen_id: number
  producto_almacen: ProductoAlmacenResponse
  unidades_derivadas: UnidadDerivadaRecepcionResponse[]
}

export interface ProveedorResponse {
  id: number
  ruc: string
  razon_social: string
}

export interface AlmacenResponse {
  id: number
  name: string
}

export interface CompraResponse {
  id: string
  serie: string
  numero: number | null
  fecha: string
  guia: string | null
  almacen_id: number
  proveedor_id: number
  proveedor: ProveedorResponse
  almacen: AlmacenResponse
}

export interface UserResponse {
  id: string
  name: string
}

export interface RecepcionAlmacenResponse {
  id: number
  numero: number
  observaciones: string | null
  fecha: string
  transportista_razon_social: string | null
  transportista_ruc: string | null
  transportista_placa: string | null
  transportista_licencia: string | null
  transportista_dni: string | null
  transportista_name: string | null
  transportista_guia_remision: string | null
  estado: boolean
  user_id: string
  compra_id: string
  compra: CompraResponse
  productos_por_almacen: ProductoAlmacenRecepcionResponse[]
  user: UserResponse
}

export interface RecepcionAlmacenFilters {
  compra_id?: string
  almacen_id?: number
  fecha_desde?: string
  fecha_hasta?: string
  user_id?: string
  estado?: boolean
}

// ============= API METHODS =============

export const recepcionAlmacenApi = {
  /**
   * Listar recepciones de almacén
   */
  async list(filters?: RecepcionAlmacenFilters): Promise<ApiResponse<{ data: RecepcionAlmacenResponse[] }>> {
    const params = new URLSearchParams()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value))
        }
      })
    }

    const queryString = params.toString()
    const url = queryString ? `/recepciones-almacen?${queryString}` : '/recepciones-almacen'

    return apiRequest<{ data: RecepcionAlmacenResponse[] }>(url)
  },

  /**
   * Obtener una recepción por ID
   */
  async getById(id: number): Promise<ApiResponse<{ data: RecepcionAlmacenResponse }>> {
    return apiRequest<{ data: RecepcionAlmacenResponse }>(`/recepciones-almacen/${id}`)
  },

  /**
   * Crear una nueva recepción de almacén
   */
  async create(data: CreateRecepcionAlmacenRequest): Promise<ApiResponse<{ data: RecepcionAlmacenResponse; message: string }>> {
    return apiRequest<{ data: RecepcionAlmacenResponse; message: string }>('/recepciones-almacen', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Eliminar (anular) una recepción de almacén
   */
  async delete(id: number): Promise<ApiResponse<{ data: RecepcionAlmacenResponse; message: string }>> {
    return apiRequest<{ data: RecepcionAlmacenResponse; message: string }>(`/recepciones-almacen/${id}`, {
      method: 'DELETE',
    })
  },
}
