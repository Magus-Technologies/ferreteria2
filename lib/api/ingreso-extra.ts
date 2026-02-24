import { apiRequest } from '../api'

export interface IngresoExtra {
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

export interface CrearIngresoExtraData {
    monto: number
    concepto: string
    supervisor_id?: string
    supervisor_password?: string
    despliegue_pago_id?: string
}

export interface AprobarIngresoExtraData {
    supervisor_id: string
    supervisor_password: string
}

export interface ResumenIngresosExtras {
    total_ingresos: number
    ingresos_hoy: number
    total_transacciones: number
    transacciones_hoy: number
    promedio_ingreso: number
}

// Obtener lista de ingresos extras
export const getIngresosExtras = async (): Promise<{ data: IngresoExtra[] }> => {
    const response = await apiRequest<{ data: IngresoExtra[] }>('/ingresos-extras')
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Obtener resumen de ingresos extras
export const getResumenIngresosExtras = async (): Promise<{ data: ResumenIngresosExtras }> => {
    const response = await apiRequest<{ data: ResumenIngresosExtras }>('/ingresos-extras/resumen')
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Crear nuevo ingreso extra
export const crearIngresoExtra = async (data: CrearIngresoExtraData): Promise<{ data: IngresoExtra }> => {
    const response = await apiRequest<{ data: IngresoExtra }>('/ingresos-extras', { method: 'POST', data })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Actualizar ingreso extra
export const updateIngresoExtra = async ({ id, data }: { id: string, data: Partial<CrearIngresoExtraData> }): Promise<{ data: IngresoExtra }> => {
    const response = await apiRequest<{ data: IngresoExtra }>(`/ingresos-extras/${id}`, { method: 'PUT', data })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Anular ingreso extra
export const anularIngresoExtra = async (id: string): Promise<{ data: IngresoExtra; message: string }> => {
    const response = await apiRequest<{ data: IngresoExtra; message: string }>(`/ingresos-extras/${id}/anular`, { method: 'POST' })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}

// Aprobar ingreso extra
export const aprobarIngresoExtra = async (id: string, data: AprobarIngresoExtraData): Promise<{ data: IngresoExtra; message: string }> => {
    const response = await apiRequest<{ data: IngresoExtra; message: string }>(`/ingresos-extras/${id}/aprobar`, { method: 'POST', data })
    if (response.error) {
        throw new Error(response.error.message)
    }
    return response.data!
}
