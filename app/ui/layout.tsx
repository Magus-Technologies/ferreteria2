'use client'

import { useRequireAuth } from '~/lib/auth-context'
import { InitStore } from './_components/others/init-store'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useRequireAuth()

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className='relative h-dvh w-dvw overflow-hidden flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Cargando...</p>
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
