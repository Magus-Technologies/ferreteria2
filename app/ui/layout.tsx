'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '~/lib/auth-context'
import { getAuthToken } from '~/lib/api'
import { InitStore } from './_components/others/init-store'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, loading } = useRequireAuth()

  // Redirigir inmediatamente si no hay token (sin esperar API)
  useEffect(() => {
    if (!getAuthToken()) {
      router.replace('/')
    }
  }, [router])

  // Si no hay token, no renderizar nada (la redirección se ejecuta arriba)
  if (typeof window !== 'undefined' && !getAuthToken()) return null

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className='relative h-dvh w-dvw overflow-hidden flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto'></div>
        </div>
      </div>
    )
  }

  // Si no hay usuario, useRequireAuth redirigirá automáticamente
  if (!user) return null

  return (
    <div className='relative h-dvh w-dvw overflow-hidden'>
      <InitStore
        marca_predeterminada={user?.empresa?.marca_id}
        almacen_predeterminado={user?.empresa?.almacen_id}
      />
      <div className='relative size-full flex flex-col
                      overflow-hidden'>
        {/* Gradiente de fondo - Responsivo */}
        <div className='absolute top-0 z-[-2] size-full bg-white
                        bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]
                        md:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]'></div>
        {Array.isArray(children) 
          ? children.map((child, index) => <div key={index}>{child}</div>)
          : children
        }
      </div>
    </div>
  )
}
