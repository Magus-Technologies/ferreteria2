// Firebase Messaging Service Worker
// Este archivo DEBE estar en la carpeta public/

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Configuración de Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDCxJbsbfz4b7vJ7LLg41i_gIEecTrMvtI",
  authDomain: "ferreteria-38320.firebaseapp.com",
  projectId: "ferreteria-38320",
  storageBucket: "ferreteria-38320.firebasestorage.app",
  messagingSenderId: "547467285968",
  appId: "1:547467285968:web:885ec98adce17b446195d5",
})

const messaging = firebase.messaging()

// Manejar notificaciones en background
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje en background:', payload)

  const notificationTitle = payload.notification?.title || 'Nueva Entrega Programada'
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes una nueva entrega asignada',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    tag: 'entrega-' + Date.now(),
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'ver', title: '👁️ Ver Entrega' },
      { action: 'cerrar', title: '❌ Cerrar' }
    ]
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Manejar clic en la notificación
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Click en notificación:', event)
  
  event.notification.close()

  if (event.action === 'ver' || !event.action) {
    // Abrir la página de entregas
    const urlToOpen = '/ui/facturacion-electronica/mis-entregas'
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Buscar si ya hay una ventana abierta
          for (const client of windowClients) {
            if (client.url.includes('/ui') && 'focus' in client) {
              // Enviar mensaje al cliente para que invalide el caché
              client.postMessage({
                type: 'INVALIDATE_ENTREGAS_CACHE',
                timestamp: Date.now()
              })
              client.navigate(urlToOpen)
              return client.focus()
            }
          }
          // Si no hay ventana abierta, abrir una nueva
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen)
          }
        })
    )
  }
})
