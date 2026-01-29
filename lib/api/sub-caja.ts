import { apiRequest, type ApiResponse } from '../api'

export interface SubCaja {
  id: number
  codigo: string
  nombre: string
  caja_principal_id: number
  tipo_caja: 'CC' | 'SC'
  despliegues_pago_ids: string[]
  tipos_comprobante: string[]
  saldo_actual: string
  saldo_vendedor?: string
  proposito?: string
  estado: boolean
}

class SubCajaApi {
  async getByCajaPrincipal(cajaPrincipalId: number): Promise<ApiResponse<{ data: SubCaja[] }>> {
    return apiRequest<{ data: SubCaja[] }>(`/cajas/cajas-principales/${cajaPrincipalId}/sub-cajas`, {
      method: 'GET',
    })
  }

  async getByCajaPrincipalConSaldoVendedor(cajaPrincipalId: number): Promise<ApiResponse<{ data: SubCaja[] }>> {
    return apiRequest<{ data: SubCaja[] }>(`/cajas/cajas-principales/${cajaPrincipalId}/sub-cajas/con-saldo-vendedor`, {
      method: 'GET',
    })
  }

  async getById(id: number): Promise<ApiResponse<{ data: SubCaja }>> {
    return apiRequest<{ data: SubCaja }>(`/cajas/sub-cajas/${id}`, {
      method: 'GET',
    })
  }
}

export const subCajaApi = new SubCajaApi()
