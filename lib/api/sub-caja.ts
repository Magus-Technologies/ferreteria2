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

export interface MetodoPagoParaVenta {
  value: string // formato: "sub_caja_id-despliegue_pago_id"
  label: string // formato: "SubCaja/Banco/Método/Titular"
  sub_caja_id: number
  despliegue_pago_id: string
  sub_caja_nombre: string
  tipos_comprobante: string[]
  banco: string
  metodo: string
  titular: string
  tipo: 'efectivo' | 'banco' | 'billetera'
  tipo_sobrecargo: string
  sobrecargo_porcentaje: string
  adicional: string
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

  async getMetodosParaVentas(): Promise<ApiResponse<{ data: MetodoPagoParaVenta[] }>> {
    return apiRequest<{ data: MetodoPagoParaVenta[] }>(`/cajas/sub-cajas/metodos-para-ventas`, {
      method: 'GET',
    })
  }
}

export const subCajaApi = new SubCajaApi()
