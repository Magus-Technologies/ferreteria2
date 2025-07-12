import BottomNav from './_components/nav/bottom-nav'
import TopNav from './_components/nav/top-nav'

export default function GestionComercialEInventarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopNav className='animate-fade-down animate-ease-in-out' />
      <div className='flex-1 flex items-center justify-center w-full px-8 overflow-y-auto'>
        {children}
      </div>
      <BottomNav className='animate-fade-up animate-ease-in-out' />
    </>
  )
}
