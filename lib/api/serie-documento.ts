/**
 * API Client para Series de Documentos (Laravel Backend)
 */
import { apiRequest, type ApiResponse } from '../api'

export interface SerieDocumentoResponse {
  id: number
  tipo_documento: string
  serie: string
  correlativo: number
  almacen_id: number
  activo: boolean
  created_at: string
  updated_at: string
  almacen: {
    id: number
    name: string
  }
}

export interface CreateSerieDocumentoRequest {
  tipo_documento: string
  serie: string
  correlativo?: number
  almacen_id: number
  activo?: boolean
}

export interface ListSerieDocumentoFilters {
  almacen_id?: number
  tipo_documento?: string
  activo?: boolean
}

export const serieDocumentoApi = {
  /**
   * Lista todas las series de documentos con filtros opcionales
   */
  list(
    filters?: ListSerieDocumentoFilters
  ): Promise<ApiResponse<{ data: SerieDocumentoResponse[] }>> {
    const params = new URLSearchParams()
    if (filters?.almacen_id) params.append('almacen_id', String(filters.almacen_id))
    if (filters?.tipo_documento) params.append('tipo_documento', filters.tipo_documento)
    if (filters?.activo !== undefined) params.append('activo', String(filters.activo))

    const queryString = params.toString()
    return apiRequest<{ data: SerieDocumentoResponse[] }>(
      `/series-documentos${queryString ? `?${queryString}` : ''}`,
      {
        method: 'GET',
      }
    )
  },

  /**
   * Crea una nueva serie de documento
   */
  create(
    data: CreateSerieDocumentoRequest
  ): Promise<
    ApiResponse<{ data: SerieDocumentoResponse; message: string }>
  > {
    return apiRequest<{ data: SerieDocumentoResponse; message: string }>(
      '/series-documentos',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  },

  /**
   * Obtiene una serie específica por ID
   */
  show(
    id: number
  ): Promise<ApiResponse<{ data: SerieDocumentoResponse }>> {
    return apiRequest<{ data: SerieDocumentoResponse }>(
      `/series-documentos/${id}`,
      {
        method: 'GET',
      }
    )
  },

  /**
   * Actualiza una serie existente
   */
  update(
    id: number,
    data: Partial<CreateSerieDocumentoRequest>
  ): Promise<
    ApiResponse<{ data: SerieDocumentoResponse; message: string }>
  > {
    return apiRequest<{ data: SerieDocumentoResponse; message: string }>(
      `/series-documentos/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    )
  },

  /**
   * Elimina una serie
   */
  destroy(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>(`/series-documentos/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Obtiene el siguiente número sin incrementar el correlativo
   */
  siguienteNumero(
    tipoDocumento: string,
    almacenId: number
  ): Promise<ApiResponse<{ data: { serie: string; numero: number } }>> {
    const params = new URLSearchParams({
      tipo_documento: tipoDocumento,
      almacen_id: String(almacenId),
    })
    return apiRequest<{ data: { serie: string; numero: number } }>(
      `/series-documentos/siguiente-numero/preview?${params.toString()}`,
      {
        method: 'GET',
      }
    )
  },
}
