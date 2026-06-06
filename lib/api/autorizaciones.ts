import { apiRequest } from '~/lib/api'

// Types

export type TipoAutorizador = 'usuario' | 'cargo' | 'jerarquia'

/** 'acceso' = autorización a nivel de vista/elemento (no una acción CRUD) */
export type AccionAutorizacion = 'crear' | 'editar' | 'eliminar' | 'acceso'

export interface AutorizacionConfig {
  id: number
  role_id: number
  modulo: string
  accion: AccionAutorizacion
  requiere_autorizacion: boolean
  tipo_autorizador: TipoAutorizador
  autorizador_id: string | null
  cargo_autorizador: string | null
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
  cargo_autorizador: string | null
  role_id: number
  modulo: string
  accion: AccionAutorizacion
  descripcion: string
  metadata: Record<string, any> | null
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  tipo_aprobacion: 'temporal' | 'permanente' | 'una_vez' | null
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
  accion: AccionAutorizacion
  tipo: 'temporal' | 'permanente' | 'una_vez'
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
    accion: AccionAutorizacion
    requiere_autorizacion: boolean
    tipo_autorizador?: TipoAutorizador
    autorizador_id?: string | null
    cargo_autorizador?: string | null
  }) => apiRequest<AutorizacionConfig>('/autorizaciones/config', { method: 'POST', data: data }),

  deleteConfig: (id: number) =>
    apiRequest('/autorizaciones/config/' + id, { method: 'DELETE' }),

  // Verificación
  verificar: (modulo: string, accion: AccionAutorizacion) =>
    apiRequest<VerificarResponse>('/autorizaciones/verificar', {
      method: 'POST',
      data: { modulo, accion },
    }),

  // Solicitudes
  solicitar: (data: {
    modulo: string
    accion: AccionAutorizacion
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
    tipo_aprobacion: 'temporal' | 'permanente' | 'una_vez'
    duracion_horas?: number
    comentario?: string
  }) => apiRequest<SolicitudAutorizacion>(`/autorizaciones/solicitudes/${id}/aprobar`, {
    method: 'POST',
    data: data,
  }),

  /** Consumir una autorización de uso único tras usarla (no-op si no es una_vez). */
  consumir: (data: { modulo: string; accion: AccionAutorizacion }) =>
    apiRequest<{ consumido: boolean }>('/autorizaciones/consumir', {
      method: 'POST',
      data: data,
    }),

  /** Supervisores válidos para autorizar en sitio esta acción (con clave). */
  supervisoresOverride: (modulo: string, accion: AccionAutorizacion) =>
    apiRequest<{ data: { id: string; name: string }[] }>('/autorizaciones/supervisores', {
      method: 'GET',
      params: { modulo, accion },
    }),

  /** Override en sitio: un supervisor autoriza con su clave (concede uso único). */
  autorizarOverride: (data: {
    modulo: string
    accion: AccionAutorizacion
    supervisor_id: string
    supervisor_password: string
  }) => apiRequest<{ data: AutorizacionOtorgada; message: string }>('/autorizaciones/override', {
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
