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
        estado_cierre?: 'pendiente' | 'en_proceso' | 'aprobado' | 'no_realizado' | null
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
    supervisor_password?: string
    email_reporte?: string
    whatsapp_reporte?: string
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
        const response: any = await apiRequest<ResumenCajaResponse>('/cajas/cierre/activa', {
            method: 'GET',
        })
        // apiRequest retorna { data: { success, data, ... } } en éxito
        // o { error: { message } } en error HTTP
        if (response?.error) {
            return { success: false, message: response.error.message }
        }
        return response?.data || { success: false, message: 'Respuesta vacía' }
    },

    /**
     * Cerrar la caja actual
     */
    cerrarCaja: async (
        aperturaId: string,
        data: CerrarCajaRequest
    ) => {
        const response: any = await apiRequest<CerrarCajaResponse>(`/cajas/cierre/${aperturaId}/cerrar`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (response?.error) {
            return { success: false, message: response.error.message }
        }
        return response?.data || { success: false, message: 'Respuesta vacía' }
    },

    /**
     * Volver a cerrar una caja ya cerrada (Re-Cierre)
     */
    reCerrarCaja: async (
        aperturaId: string,
        data: CerrarCajaRequest
    ) => {
        const response: any = await apiRequest<CerrarCajaResponse>(`/cajas/cierre/${aperturaId}/re-cerrar`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (response?.error) {
            return { success: false, message: response.error.message }
        }
        return response?.data || { success: false, message: 'Respuesta vacía' }
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

    /**
     * Enviar ticket de cierre por email
     */
    enviarTicketEmail: async (cierreId: string, email: string, pdfBlob: Blob) => {
        const formData = new FormData()
        formData.append('email', email)
        formData.append('pdf', pdfBlob, `ticket-cierre-${cierreId}.pdf`)

        // Para FormData, no usar apiRequest porque establece Content-Type JSON
        // Usar fetch directamente
        const token = localStorage.getItem('auth_token') // ✅ Usar la clave correcta
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

        const response = await fetch(`${baseURL}/cajas/cierre/${cierreId}/enviar-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // NO establecer Content-Type, el navegador lo hace automáticamente con boundary
            },
            body: formData,
        })

        if (!response.ok) {
            // Intentar parsear como JSON, si falla mostrar el status
            try {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Error al enviar el ticket')
            } catch (e) {
                // Si no es JSON, mostrar el status HTTP
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }
        }

        return await response.json()
    },

    /**
     * Aprobar un cierre pendiente con clave de supervisor
     */
    aprobarCierre: async (cierreId: string, supervisorId: string, supervisorPassword: string) => {
        const response = await apiRequest(`/cajas/cierre/${cierreId}/aprobar`, {
            method: 'POST',
            body: JSON.stringify({
                supervisor_id: supervisorId,
                supervisor_password: supervisorPassword,
            }),
        })
        return response.data
    },
}
