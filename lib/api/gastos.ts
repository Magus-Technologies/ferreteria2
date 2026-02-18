import { apiRequest } from '../api'

export interface Gasto {
  id: string
  fecha: string
  monto: number
  destino: string
  motivo: string
  comprobante: string
  cajero: string
  autoriza: string
  anulado: boolean
  tipo_origen?: string
  metodo_pago?: string
  vuelto?: number
}

export interface ResumenGastos {
  total_gastos: number
  gastos_hoy: number
  total_transacciones: number
  transacciones_hoy: number
  promedio_gasto: number
}

export interface FiltrosGastos {
  almacen_id?: number
  fechaDesde?: string
  fechaHasta?: string
  motivoGasto?: string
  cajeroRegistra?: string
  sucursal?: string
  busqueda?: string
}

export interface CrearGastoData {
  monto: number
  motivo: string
  destino?: string
  comprobante?: string
  vuelto?: number
  despliegue_de_pago_id: string
  autoriza?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  resumen: any
  pagination: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number
    to: number
  }
}

// Obtener lista de gastos con filtros
export const getGastos = async (
  filtros: FiltrosGastos & { per_page?: number; page?: number }
): Promise<PaginatedResponse<Gasto>> => {
  const response = await apiRequest<PaginatedResponse<Gasto>>('/gastos', { params: filtros })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Obtener resumen de gastos para cards
export const getResumenGastos = async (
  filtros: FiltrosGastos
): Promise<{ data: ResumenGastos }> => {
  const response = await apiRequest<{ data: ResumenGastos }>('/gastos/resumen', { params: filtros })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Crear nuevo gasto
export const crearGasto = async (data: CrearGastoData): Promise<{ data: Gasto }> => {
  const response = await apiRequest<{ data: Gasto }>('/gastos', { method: 'POST', data })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Obtener gasto específico
export const getGasto = async (id: string): Promise<{ data: Gasto }> => {
  const response = await apiRequest<{ data: Gasto }>(`/gastos/${id}`)
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Actualizar gasto
export const actualizarGasto = async (
  id: string,
  data: CrearGastoData
): Promise<{ data: Gasto }> => {
  const response = await apiRequest<{ data: Gasto }>(`/gastos/${id}`, { method: 'PUT', data })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Anular gasto
export const anularGasto = async (
  id: string,
  motivo: string
): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>(`/gastos/${id}`, { method: 'DELETE', data: { motivo } })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Exportar reporte
export const exportarReporteGastos = async (
  filtros: FiltrosGastos & { formato: 'excel' | 'pdf' }
): Promise<{ data: { url: string; nombre: string } }> => {
  const response = await apiRequest<{ data: { url: string; nombre: string } }>('/gastos/exportar', { method: 'POST', data: filtros })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Enviar por correo
export const enviarReporteGastosCorreo = async (
  email: string,
  filtros: FiltrosGastos
): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>('/gastos/enviar-correo', { method: 'POST', data: { email, ...filtros } })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}