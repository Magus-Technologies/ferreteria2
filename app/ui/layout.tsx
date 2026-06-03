'use client'

import { useRequireAuth } from '~/lib/auth-context'
import { InitStore } from './_components/others/init-store'
import { useStoreAuth } from '~/store/store-auth'
import { Providers } from './_components/providers-auth'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useRequireAuth()
  const hasHydrated = useStoreAuth((s) => s.hasHydrated)

  // Mientras zustand no termina de leer el localStorage, el segmento
  // /ui/loading.tsx se muestra automáticamente (streaming de Next 15).
  if (!hasHydrated) return null

  // Si no hay user (post-hidratación), useRequireAuth ya disparó el redirect.
  if (!user) return null

  return (
    <Providers>
      <div className='relative h-dvh w-dvw overflow-hidden'>
        <InitStore
          marca_predeterminada={user?.empresa?.marca_id}
          almacen_predeterminado={user?.empresa?.almacen_id}
        />
        <div className='relative size-full flex flex-col overflow-hidden'>
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
    </Providers>
  )
}
