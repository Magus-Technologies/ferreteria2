import BottomNav from './_components/nav/bottom-nav'
import TopNav from './_components/nav/top-nav'
import AccesoGuard from '../_components/acceso-guard'

export default function GestionContableYFinancieraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <TopNav className='animate-fade-down animate-ease-in-out' />
      {/* items-START, no items-center: este contenedor scrollea
          (`overflow-y-auto`), y con `items-center` flexbox centra el contenido
          cuando es más alto que la pantalla, empujando su parte superior POR
          ENCIMA del origen del scroll. Esa zona es inalcanzable —el navegador no
          scrollea antes del inicio— así que el título del módulo y las primeras
          tarjetas quedaban cortados de forma permanente (se veía en Cierre de
          Caja). Los otros cuatro módulos ya usaban items-start. */}
      <div className='flex-1 flex items-start justify-center w-full
                      px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8
                      overflow-y-auto overflow-x-hidden'>
        <AccesoGuard>{children}</AccesoGuard>
      </div>
      <BottomNav className='animate-fade-up animate-ease-in-out' />
    </>
  )
}
