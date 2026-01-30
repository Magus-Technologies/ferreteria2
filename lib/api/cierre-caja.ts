import { apiRequest } from '../api'

export interface ResumenCajaResponse {
    success: boolean
    data: {
        id: string
        caja_principal_id: string
        sub_caja_id: string
        user_id: string
        monto_apertura: number
        fecha_apertura: string
        fecha_cierre: string | null
        monto_cierre: number | null
        estado: 'abierta' | 'cerrada'
        resumen: {
            efectivo_inicial: number
            monto_apertura: number
            total_ingresos: number
            total_egresos: number
            total_ventas: number
            monto_esperado: number
            monto_cierre: number | null
            diferencia: number | null
            detalle_metodos_pago: Array<{
                metodo_pago_id: string
                metodo_pago: string
                despliegue_pago: string
                total: number
                cantidad_transacciones: number
                tipo: string
            }>
            detalle_ingresos: Record<string, any>
            detalle_egresos: Record<string, any>
            detalle_ventas: any[]
            prestamos_recibidos: any[]
            total_prestamos_recibidos: number
            prestamos_dados: any[]
            total_prestamos_dados: number
            movimientos_internos: any[]
            prestamos: any[]
            prestamos_vendedores: any[]
        }
    }
}

export interface CerrarCajaRequest {
    monto_cierre_efectivo: number
    total_cuentas: number
    supervisor_id?: string
    comentarios?: string
    conteo_billetes_monedas?: Record<string, number>
    conceptos_adicionales?: Array<{
        concepto: string
        numero?: string
        cantidad: number
    }>
    forzar_cierre?: boolean
}

export interface CerrarCajaResponse {
    success: boolean
    message: string
    data: {
        apertura: any
        resumen: any
    }
}

export const cierreCajaApi = {
    /**
     * Obtener la caja activa del vendedor actual con su resumen
     */
    obtenerCajaActiva: async () => {
        const response = await apiRequest<ResumenCajaResponse>('/cajas/cierre/activa', {
            method: 'GET',
        })
        return response.data as ResumenCajaResponse
    },

    /**
     * Cerrar la caja actual
     */
    cerrarCaja: async (
        aperturaId: string,
        data: CerrarCajaRequest
    ) => {
        const response = await apiRequest<CerrarCajaResponse>(`/cajas/cierre/${aperturaId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        return response.data as CerrarCajaResponse
    },

    /**
     * Obtener detalle completo de movimientos
     */
    obtenerDetalleMovimientos: async (aperturaId: string) => {
        const response = await apiRequest(`/cajas/cierre/${aperturaId}/movimientos`, {
            method: 'GET',
        })
        return response.data
    },

    /**
     * Validar supervisor para cierre forzado
     */
    validarSupervisor: async (email: string, password: string) => {
        const response = await apiRequest('/cajas/cierre/validar-supervisor', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        })
        return response.data
    },
}
