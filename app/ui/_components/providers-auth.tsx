'use client'
import { ReactNode } from 'react'
import dynamic from 'next/dynamic'

// Estos providers solo se cargan en el segmento autenticado (/ui).
// El login y los loadings no los necesitan → menos JS al primer paint.
const NotificationInitializer = dynamic(
  () => import('~/components/notifications/notification-initializer'),
  { ssr: false }
)
const BirthdayAlert = dynamic(
  () => import('~/components/birthday/birthday-alert'),
  { ssr: false }
)
const RealtimeProvider = dynamic(
  () => import('~/components/realtime/realtime-provider'),
  { ssr: false }
)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <NotificationInitializer />
      <BirthdayAlert />
      <RealtimeProvider />
      {children}
    </>
  )
}
