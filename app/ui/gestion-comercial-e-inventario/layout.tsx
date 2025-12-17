import BottomNav from './_components/nav/bottom-nav'
import TopNav from './_components/nav/top-nav'

export default function GestionComercialEInventarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='h-dvh w-full flex flex-col overflow-hidden'>
      <TopNav className='animate-fade-down animate-ease-in-out flex-shrink-0' />
      <div className='flex-1 w-full
                      px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8
                      py-2 sm:py-3 md:py-4
                      overflow-y-auto overflow-x-hidden'>
        {children}
      </div>
      <BottomNav className='animate-fade-up animate-ease-in-out flex-shrink-0' />
    </div>
  )
}
