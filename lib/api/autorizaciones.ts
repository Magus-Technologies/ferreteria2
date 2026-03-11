import { apiRequest } from '~/lib/api'

// Types

export interface AutorizacionConfig {
  id: number
  role_id: number
  modulo: string
  accion: 'crear' | 'editar' | 'eliminar'
  requiere_autorizacion: boolean
  autorizador_id: string | null
  autorizador?: { id: string; name: string } | null
  role?: { id: number; name: string } | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface SolicitudAutorizacion {
  id: string
  solicitante_id: string
  autorizador_id: string | null
  role_id: number
  modulo: string
  accion: 'crear' | 'editar' | 'eliminar'
  descripcion: string
  metadata: Record<string, any> | null
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  tipo_aprobacion: 'temporal' | 'permanente' | null
  duracion_horas: number | null
  respondido_por: string | null
  respondido_at: string | null
  comentario_respuesta: string | null
  created_at: string
  updated_at: string
  solicitante?: { id: string; name: string; image?: string } | null
  autorizador?: { id: string; name: string } | null
  respondidoPor?: { id: string; name: string } | null  // snake → camel via Laravel
  respondido_por_user?: { id: string; name: string } | null
  role?: { id: number; name: string } | null
}

export interface AutorizacionOtorgada {
  id: string
  user_id: string
  role_id: number
  modulo: string
  accion: 'crear' | 'editar' | 'eliminar'
  tipo: 'temporal' | 'permanente'
  fecha_expiracion: string | null
  otorgada_por: string
  solicitud_id: string | null
  activa: boolean
  created_at: string
  otorgada_por_user?: { id: string; name: string } | null
  role?: { id: number; name: string } | null
}

export interface VerificarResponse {
  requiere: boolean
  tiene_autorizacion: boolean
  config_id?: number
  autorizador_id?: string | null
}

// API Functions

export const autorizacionesApi = {
  // Configuración
  getConfigs: (roleId?: number) =>
    apiRequest<AutorizacionConfig[]>(
      roleId ? `/autorizaciones/config/${roleId}` : '/autorizaciones/config'
    ),

  saveConfig: (data: {
    role_id: number
    modulo: string
    accion: 'crear' | 'editar' | 'eliminar'
    requiere_autorizacion: boolean
    autorizador_id?: string | null
  }) => apiRequest<AutorizacionConfig>('/autorizaciones/config', { method: 'POST', data: data }),

  deleteConfig: (id: number) =>
    apiRequest('/autorizaciones/config/' + id, { method: 'DELETE' }),

  // Verificación
  verificar: (modulo: string, accion: 'crear' | 'editar' | 'eliminar') =>
    apiRequest<VerificarResponse>('/autorizaciones/verificar', {
      method: 'POST',
      data: { modulo, accion },
    }),

  // Solicitudes
  solicitar: (data: {
    modulo: string
    accion: 'crear' | 'editar' | 'eliminar'
    descripcion: string
    metadata?: Record<string, any>
  }) => apiRequest<SolicitudAutorizacion>('/autorizaciones/solicitar', { method: 'POST', data: data }),

  misSolicitudes: () =>
    apiRequest<SolicitudAutorizacion[]>('/autorizaciones/mis-solicitudes'),

  pendientes: () =>
    apiRequest<SolicitudAutorizacion[]>('/autorizaciones/pendientes'),

  pendientesCount: () =>
    apiRequest<{ count: number }>('/autorizaciones/pendientes/count'),

  aprobar: (id: string, data: {
    tipo_aprobacion: 'temporal' | 'permanente'
    duracion_horas?: number
    comentario?: string
  }) => apiRequest<SolicitudAutorizacion>(`/autorizaciones/solicitudes/${id}/aprobar`, {
    method: 'POST',
    data: data,
  }),

  rechazar: (id: string, data?: { comentario?: string }) =>
    apiRequest<SolicitudAutorizacion>(`/autorizaciones/solicitudes/${id}/rechazar`, {
      method: 'POST',
      data: data || {},
    }),

  // Otorgadas
  otorgadas: (userId: string) =>
    apiRequest<AutorizacionOtorgada[]>(`/autorizaciones/otorgadas/${userId}`),

  revocar: (id: string) =>
    apiRequest(`/autorizaciones/otorgadas/${id}`, { method: 'DELETE' }),
}

// Query Keys
export const autorizacionesKeys = {
  all: ['autorizaciones'] as const,
  configs: (roleId?: number) => ['autorizaciones', 'config', roleId] as const,
  pendientes: () => ['autorizaciones', 'pendientes'] as const,
  pendientesCount: () => ['autorizaciones', 'pendientes', 'count'] as const,
  misSolicitudes: () => ['autorizaciones', 'mis-solicitudes'] as const,
  otorgadas: (userId: string) => ['autorizaciones', 'otorgadas', userId] as const,
}
