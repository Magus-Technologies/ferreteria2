import { apiRequest } from '../api'

export interface GastoExtra {
    id: string
    monto: number
    concepto: string
    estado?: string
    user_id: string
    despliegue_pago_id: string | null
    created_at: string
    updated_at: string
    user?: {
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
    compra?: {
        id: string
        serie?: string
        numero?: string
        fecha?: string
        proveedor?: { nombre: string }
    }
}

export interface CrearGastoExtraData {
    monto: number
    concepto: string
    despliegue_pago_id?: string
}

export interface ResumenGastosExtras {
    total_gastos: number
    gastos_hoy: number
    total_transacciones: number
    transacciones_hoy: number
    promedio_gasto: number
    // Desglose adicional
    gastos_extras?: number
    perdidas_salidas?: number
}

// Obtener lista de gastos extras
export const getGastosExtras = async (filtros?: Record<string, any>): Promise<{ data: GastoExtra[] }> => {
    const response = await apiRequest<{ data: GastoExtra[] }>('/gastos-extras', { 
        method: 'GET',
        params: filtros 
    })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Obtener resumen de gastos extras
export const getResumenGastosExtras = async (filtros?: Record<string, any>): Promise<{ data: ResumenGastosExtras }> => {
    const response = await apiRequest<{ data: ResumenGastosExtras }>('/gastos-extras/resumen', {
        method: 'GET',
        params: filtros
    })
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

// Eliminar gasto extra
export const eliminarGastoExtra = async (id: string): Promise<{ message: string }> => {
    const response = await apiRequest<{ message: string }>(`/gastos-extras/${id}`, { method: 'DELETE' })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}
