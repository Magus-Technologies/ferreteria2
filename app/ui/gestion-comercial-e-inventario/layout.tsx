import BottomNav from './_components/bottom-nav'
import TopNav from './_components/top-nav'

export default function GestionComercialEInventarioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopNav />
      <div className='flex-1'>{children}</div>
      <BottomNav />
    </>
  )
}
