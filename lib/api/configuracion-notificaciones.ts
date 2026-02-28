import { apiRequest } from '~/lib/api'

export type TipoNotificacion = 'cumpleanos' | 'entrega' | 'pago' | 'vale' | 'caja'

export interface ConfiguracionNotificacion {
  id: string | null
  user_id: string | null
  tipo: TipoNotificacion
  habilitado: boolean
  dias_anticipacion: number
  extra: Record<string, unknown> | null
}

export interface GuardarConfiguracionRequest {
  tipo: TipoNotificacion
  habilitado: boolean
  dias_anticipacion: number
  extra?: Record<string, unknown> | null
}

export const configuracionNotificacionesApi = {
  async getAll() {
    return apiRequest<{ data: ConfiguracionNotificacion[] }>('/configuracion-notificaciones')
  },

  async guardar(data: GuardarConfiguracionRequest) {
    return apiRequest<{ message: string; data: ConfiguracionNotificacion }>(
      '/configuracion-notificaciones',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  },

  async getCumpleanos() {
    return apiRequest<{ data: { habilitado: boolean; dias_anticipacion: number } }>(
      '/configuracion-notificaciones/cumpleanos'
    )
  },
}
