import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getAuthToken } from './api'

// Pusher must be globally available for Laravel Echo
if (typeof window !== 'undefined') {
  ;(window as any).Pusher = Pusher
}

let echoInstance: Echo<'reverb'> | null = null

export function getEcho(): Echo<'reverb'> | null {
  if (typeof window === 'undefined') return null

  if (!echoInstance) {
    const token = getAuthToken()
    if (!token) return null

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
    const wsHost = process.env.NEXT_PUBLIC_REVERB_HOST || 'localhost'
    const wsPort = Number(process.env.NEXT_PUBLIC_REVERB_PORT || 8080)

    echoInstance = new Echo({
      broadcaster: 'reverb',
      key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'ferreteria-reverb-key',
      wsHost,
      wsPort,
      wssPort: wsPort,
      forceTLS: false,
      enabledTransports: ['ws'],
      authEndpoint: `${apiBase}/api/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
  }

  return echoInstance
}

export function destroyEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}
