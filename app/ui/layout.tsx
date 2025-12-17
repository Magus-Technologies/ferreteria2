import { redirect } from 'next/navigation'
import { auth } from '~/auth/auth'
import { InitStore } from './_components/others/init-store'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/')

  return (
    <div className='relative h-dvh w-dvw overflow-hidden'>
      <InitStore
        marca_predeterminada={session?.user?.empresa?.marca_id}
        almacen_predeterminado={session?.user?.empresa?.almacen_id}
      />
      <div className='relative size-full flex flex-col items-center justify-center
                      overflow-x-hidden overflow-y-auto
                      scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'>
        {/* Gradiente de fondo - Responsivo */}
        <div className='absolute top-0 z-[-2] size-full bg-white
                        bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]
                        md:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]'></div>
        {children}
      </div>
    </div>
  )
}
