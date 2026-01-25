import { apiRequest, type ApiResponse } from '../api'

export interface VendedorConEfectivo {
    vendedor_id: number
    vendedor_nombre: string
    efectivo_inicial: string
    efectivo_disponible: string
}

export interface SolicitudEfectivo {
    id: number
    vendedor_solicitante: {
        id: number
        name: string
    }
    vendedor_prestamista: {
        id: number
        name: string
    }
    monto_solicitado: number
    estado: 'pendiente' | 'aprobada' | 'rechazada'
    motivo?: string
    created_at: string
}

export interface TransferenciaEfectivo {
    id: number
    vendedor_origen: {
        id: number
        name: string
    }
    vendedor_destino: {
        id: number
        name: string
    }
    monto: number
    tipo: string
    created_at: string
}

export interface CrearSolicitudRequest {
    apertura_cierre_caja_id: string
    vendedor_prestamista_id: number
    monto_solicitado: number
    motivo?: string
}

export interface AprobarSolicitudRequest {
    sub_caja_origen_id: number
    monto_aprobado?: number
}

export interface RechazarSolicitudRequest {
    comentario?: string
}

export const prestamoVendedorApi = {
    // Crear solicitud de efectivo
    crearSolicitud: async (data: CrearSolicitudRequest): Promise<ApiResponse<any>> => {
        return apiRequest('/cajas/prestamos-vendedores', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // Aprobar solicitud
    aprobarSolicitud: async (
        solicitudId: number,
        subCajaOrigenId: number,
        montoAprobado?: number
    ): Promise<ApiResponse<any>> => {
        const data: AprobarSolicitudRequest = {
            sub_caja_origen_id: subCajaOrigenId,
            ...(montoAprobado && { monto_aprobado: montoAprobado }),
        }
        return apiRequest(`/cajas/prestamos-vendedores/${solicitudId}/aprobar`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // Rechazar solicitud
    rechazarSolicitud: async (solicitudId: number, comentario?: string): Promise<ApiResponse<any>> => {
        const data: RechazarSolicitudRequest = {
            ...(comentario && { comentario }),
        }
        return apiRequest(`/cajas/prestamos-vendedores/${solicitudId}/rechazar`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
    },

    // Listar solicitudes pendientes (recibidas)
    solicitudesPendientes: async (): Promise<ApiResponse<SolicitudEfectivo[]>> => {
        return apiRequest('/cajas/prestamos-vendedores/pendientes')
    },

    // Listar todas las solicitudes
    listarSolicitudes: async (): Promise<ApiResponse<SolicitudEfectivo[]>> => {
        return apiRequest('/cajas/prestamos-vendedores')
    },

    // Obtener vendedores con efectivo disponible
    obtenerVendedoresConEfectivo: async (aperturaId: string): Promise<ApiResponse<VendedorConEfectivo[]>> => {
        return apiRequest(`/cajas/vendedores/con-efectivo?apertura_id=${aperturaId}`)
    },

    // Listar transferencias
    listarTransferencias: async (): Promise<ApiResponse<TransferenciaEfectivo[]>> => {
        return apiRequest('/cajas/prestamos-vendedores/transferencias')
    },
}
