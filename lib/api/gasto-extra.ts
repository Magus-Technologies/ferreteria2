import { apiRequest } from '../api'

export interface GastoExtra {
    id: string
    monto: number
    concepto: string
    estado: 'pendiente' | 'aprobado' | 'anulado'
    user_id: string
    supervisor_id: string | null
    despliegue_pago_id: string | null
    created_at: string
    updated_at: string
    user?: {
        id: string
        name: string
    }
    supervisor?: {
        id: string
        name: string
    }
    despliegue_pago?: {
        id: string
        name: string
        subcaja_nombre?: string
        metodo_de_pago?: {
            name: string
        }
    }
}

export interface CrearGastoExtraData {
    monto: number
    concepto: string
    supervisor_id?: string
    supervisor_password?: string
    despliegue_pago_id?: string
}

export interface AprobarGastoExtraData {
    supervisor_id: string
    supervisor_password: string
}

export interface ResumenGastosExtras {
    total_gastos: number
    gastos_hoy: number
    total_transacciones: number
    transacciones_hoy: number
    promedio_gasto: number
}

// Obtener lista de gastos extras
export const getGastosExtras = async (): Promise<{ data: GastoExtra[] }> => {
    const response = await apiRequest<{ data: GastoExtra[] }>('/gastos-extras')
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Obtener resumen de gastos extras
export const getResumenGastosExtras = async (): Promise<{ data: ResumenGastosExtras }> => {
    const response = await apiRequest<{ data: ResumenGastosExtras }>('/gastos-extras/resumen')
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Crear nuevo gasto extra
export const crearGastoExtra = async (data: CrearGastoExtraData): Promise<{ data: GastoExtra }> => {
    const response = await apiRequest<{ data: GastoExtra }>('/gastos-extras', { method: 'POST', data })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Actualizar gasto extra
export const updateGastoExtra = async ({ id, data }: { id: string, data: Partial<CrearGastoExtraData> }): Promise<{ data: GastoExtra }> => {
    const response = await apiRequest<{ data: GastoExtra }>(`/gastos-extras/${id}`, { method: 'PUT', data })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Anular gasto extra
export const anularGastoExtra = async (id: string): Promise<{ data: GastoExtra; message: string }> => {
    const response = await apiRequest<{ data: GastoExtra; message: string }>(`/gastos-extras/${id}/anular`, { method: 'POST' })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Aprobar gasto extra
export const aprobarGastoExtra = async (id: string, data: AprobarGastoExtraData): Promise<{ data: GastoExtra; message: string }> => {
    const response = await apiRequest<{ data: GastoExtra; message: string }>(`/gastos-extras/${id}/aprobar`, { method: 'POST', data })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}
