'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import dynamic from 'next/dynamic'

const NotificationInitializer = dynamic(() => import('~/components/notifications/notification-initializer'), { ssr: false })
const BirthdayAlert = dynamic(() => import('~/components/birthday/birthday-alert'), { ssr: false })
const RealtimeProvider = dynamic(() => import('~/components/realtime/realtime-provider'), { ssr: false })

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000,   // 10 minutos (anteriormente cacheTime)
        retry: (failureCount, error) => {
          // Solo reintentar en errores de red, no en errores de autorización
          if (error instanceof Error && error.message.includes('No tienes permiso')) {
            return false
          }
          return failureCount < 2
        },
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
        refetchOnReconnect: 'always',
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationInitializer />
      <BirthdayAlert />
      <RealtimeProvider />
      {children}
    </QueryClientProvider>
  )
}
