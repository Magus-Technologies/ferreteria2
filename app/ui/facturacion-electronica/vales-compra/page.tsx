'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import ModalPdfValeWrapper from './_components/modals/modal-pdf-vale-wrapper'

// Lazy loading de componentes pesados
const FiltersValesCompra = lazy(() => import('./_components/filters/filters-vales-compra'))
const TableValesCompra = lazy(() => import('./_components/tables/table-vales-compra'))
const TableDetalleVale = lazy(() => import('./_components/tables/table-detalle-vale'))
const CardsInfoVales = lazy(() => import('./_components/cards/cards-info-vales'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function ValesCompraPage() {
  return (
    <>
      <ModalPdfValeWrapper />
      <ContenedorGeneral>
      <div className='w-full'>
        <Suspense fallback={<ComponentLoading />}>
          <FiltersValesCompra />
        </Suspense>
        
        {/* Layout responsivo igual a Mis Ventas */}
        <div className='w-full mt-4'>
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8'>
            {/* Columna principal - Tablas */}
            <div className='flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0'>
              <div className='h-[300px]'>
                <Suspense fallback={<ComponentLoading />}>
                  <TableValesCompra />
                </Suspense>
              </div>
              <div>
                <Suspense fallback={<ComponentLoading />}>
                  <TableDetalleVale />
                </Suspense>
              </div>
            </div>
            
            {/* Columna lateral - Cards (Solo Desktop) */}
            <div className='hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]'>
              <Suspense fallback={<Spin />}>
                <CardsInfoVales />
              </Suspense>
            </div>
          </div>

          {/* Cards de información - Móvil/Tablet: Abajo en grid */}
          <div className='lg:hidden mt-4'>
            <Suspense fallback={<Spin />}>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <CardsInfoVales />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
    </>
  )
}
