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
  if (typeof window === 'undefined') return null
  
  try {
    const permission = await Notification.requestPermission()
    
    if (permission !== 'granted') {
      console.log('Permiso de notificaciones denegado')
      return null
    }

    if (!messaging) {
      console.error('Firebase Messaging no está inicializado')
      return null
    }

    // Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    console.log('Service Worker registrado:', registration)

    // Obtener token FCM
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    console.log('Token FCM obtenido:', token)
    return token
  } catch (error) {
    console.error('Error obteniendo token FCM:', error)
    return null
  }
}

/**
 * Escucha mensajes en primer plano
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) return () => {}
  
  return onMessage(messaging, (payload) => {
    console.log('Mensaje recibido en primer plano:', payload)
    callback(payload)
  })
}

export { app, messaging }
