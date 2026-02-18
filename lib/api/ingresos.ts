import { apiRequest } from '../api'

export interface Ingreso {
  id: string
  fecha: string
  monto: number
  concepto: string
  comentario: string
  cajero: string
  autoriza: string
  anulado: boolean
  tipo_origen?: string
  metodo_pago?: string
}

export interface ResumenIngresos {
  total_ingresos: number
  ingresos_hoy: number
  total_transacciones: number
  transacciones_hoy: number
  promedio_ingreso: number
}

export interface FiltrosIngresos {
  almacen_id?: number
  desde?: string
  hasta?: string
  user_id?: string
  concepto?: string
  search?: string
}

export interface CrearIngresoData {
  monto: number
  concepto: string
  comentario?: string
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

// Obtener lista de ingresos con filtros
export const getIngresos = async (
  filtros: FiltrosIngresos & { per_page?: number; page?: number }
): Promise<PaginatedResponse<Ingreso>> => {
  const response = await apiRequest<PaginatedResponse<Ingreso>>('/ingresos', { params: filtros })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Obtener resumen de ingresos para cards
export const getResumenIngresos = async (
  filtros: FiltrosIngresos
): Promise<{ data: ResumenIngresos }> => {
  const response = await apiRequest<{ data: ResumenIngresos }>('/ingresos/resumen', { params: filtros })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Crear nuevo ingreso
export const crearIngreso = async (data: CrearIngresoData): Promise<{ data: Ingreso }> => {
  const response = await apiRequest<{ data: Ingreso }>('/ingresos', { method: 'POST', data })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Obtener ingreso específico
export const getIngreso = async (id: string): Promise<{ data: Ingreso }> => {
  const response = await apiRequest<{ data: Ingreso }>(`/ingresos/${id}`)
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Actualizar ingreso
export const actualizarIngreso = async (
  id: string,
  data: CrearIngresoData
): Promise<{ data: Ingreso }> => {
  const response = await apiRequest<{ data: Ingreso }>(`/ingresos/${id}`, { method: 'PUT', data })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Anular ingreso
export const anularIngreso = async (
  id: string,
  motivo: string
): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>(`/ingresos/${id}`, { method: 'DELETE', data: { motivo } })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Exportar reporte
export const exportarReporteIngresos = async (
  filtros: FiltrosIngresos & { formato: 'excel' | 'pdf' }
): Promise<{ data: { url: string; nombre: string } }> => {
  const response = await apiRequest<{ data: { url: string; nombre: string } }>('/ingresos/exportar', { method: 'POST', data: filtros })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}

// Enviar por correo
export const enviarReporteIngresosCorreo = async (
  email: string,
  filtros: FiltrosIngresos
): Promise<{ message: string }> => {
  const response = await apiRequest<{ message: string }>('/ingresos/enviar-correo', { method: 'POST', data: { email, ...filtros } })
  if (response.error) {
    throw new Error(response.error.message)
  }
  return response.data!
}