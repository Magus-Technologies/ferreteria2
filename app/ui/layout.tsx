import { redirect } from 'next/navigation'
import { auth } from '~/auth/auth'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  console.log('🚀 ~ file: layout.tsx:9 ~ session:', session)
  if (!session) redirect('/')

  return (
    <div className='relative h-dvh w-dvw overflow-y-hidden overflow-x-auto'>
      <div className='relative size-full flex flex-col items-center justify-center min-w-fit'>
        <div className='absolute top-0 z-[-2] size-full bg-white bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]'></div>
        {children}
      </div>
    </div>
  )
}
