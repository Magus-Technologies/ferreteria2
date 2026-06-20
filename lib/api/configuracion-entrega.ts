import { apiRequest } from '~/lib/api'
import type { ApiResponse } from '~/lib/api'

export interface ConfiguracionEntrega {
  roles_entrega_tienda: string[]
}

export const configuracionEntregaApi = {
  get: (): Promise<ApiResponse<ConfiguracionEntrega>> =>
    apiRequest('/configuracion/entrega', { method: 'GET' }),

  update: (data: ConfiguracionEntrega): Promise<ApiResponse<{ success: boolean }>> =>
    apiRequest('/configuracion/entrega', { method: 'PUT', data }),
}
