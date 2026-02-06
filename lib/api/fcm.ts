/**
 * API Client para FCM Tokens (Firebase Cloud Messaging)
 */

import { apiRequest, type ApiResponse } from '../api'

export interface UpdateFcmTokenRequest {
  fcm_token: string
}

export interface SendNotificationRequest {
  user_id: string
  title: string
  body: string
  data?: Record<string, string>
}

export const fcmApi = {
  /**
   * Actualiza el token FCM del usuario actual
   */
  async updateToken(data: UpdateFcmTokenRequest): Promise<ApiResponse<{ message: string }>> {
    console.log('📤 fcmApi.updateToken - Enviando token al backend:', data.fcm_token.substring(0, 20) + '...')
    
    const response = await apiRequest<{ message: string }>('/usuarios/fcm-token', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    console.log('📥 fcmApi.updateToken - Respuesta del backend:', response)
    
    return response
  },

  /**
   * Envía una notificación push a un usuario específico
   */
  async sendNotification(data: SendNotificationRequest): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/notificaciones/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Envía notificación de entrega programada al despachador
   */
  async notifyEntregaProgramada(data: {
    despachador_id: string
    venta_serie: string
    venta_numero: string
    direccion: string
    fecha_programada: string
    cliente_nombre?: string
  }): Promise<ApiResponse<{ message: string }>> {
    return apiRequest<{ message: string }>('/notificaciones/entrega-programada', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
