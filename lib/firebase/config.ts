import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyDCxJbsbfz4b7vJ7LLg41i_gIEecTrMvtI",
  authDomain: "ferreteria-38320.firebaseapp.com",
  projectId: "ferreteria-38320",
  storageBucket: "ferreteria-38320.firebasestorage.app",
  messagingSenderId: "547467285968",
  appId: "1:547467285968:web:885ec98adce17b446195d5",
  measurementId: "G-7T76XKK2NM"
}

// VAPID Key para Web Push
const VAPID_KEY = 'BOqaC6Zwauig1Xv6HLYIrhW4LKfvWxRAcvHlt6zsgz-NgLkbx6OhxAkvmfGmz6SSnNCZoWnMHtQVdL_M9MmlaaA'

// Initialize Firebase (solo una vez)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

let messaging: Messaging | null = null

// Solo inicializar messaging en el cliente
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app)
  } catch (error) {
    console.error('Error inicializando Firebase Messaging:', error)
  }
}

/**
 * Solicita permiso y obtiene el token FCM del usuario
 */
export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      return null
    }

    if (!messaging) {
      console.error('❌ Firebase Messaging no está inicializado')
      return null
    }

    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    // Obtener token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    return token
  } catch (error) {
    console.error('❌ Error obteniendo token FCM:', error)
    return null
  }
}

/**
 * Escucha mensajes en primer plano
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {}
  
  return onMessage(messaging, (payload) => {
    callback(payload)
  })
}

/**
 * Verifica si el token FCM actual es el mismo que el último registrado.
 * Si cambió, devuelve el nuevo token para que el caller lo re-registre.
 * 
 * Almacena el último token en sessionStorage para detección de cambios
 * dentro de la misma sesión del navegador.
 */
export async function getCurrentFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !messaging) return null

  try {
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    return token
  } catch {
    return null
  }
}

/**
 * Compara el token actual con el último registrado.
 * Si es diferente, devuelve el nuevo token para re-registrar.
 */
export function hasTokenChanged(newToken: string): boolean {
  if (typeof window === 'undefined') return false
  const lastToken = sessionStorage.getItem('fcm_last_token')
  return lastToken !== newToken
}

export function storeLastToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('fcm_last_token', token)
  }
}

export { app, messaging }
