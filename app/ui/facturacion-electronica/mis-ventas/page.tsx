'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import ModalPdfVentaWrapper from './_components/modals/modal-pdf-venta-wrapper'

// Lazy loading de componentes pesados
const FiltersMisVentas = lazy(() => import('./_components/filters/filters-mis-ventas'))
const TableMisVentas = lazy(() => import('./_components/tables/table-mis-ventas'))
const TableDetalleVenta = lazy(() => import('./_components/tables/table-detalle-venta'))
const CardsInfoVentas = lazy(() => import('./_components/others/cards-info-ventas'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisVentas() {
  const canAccess = usePermission(permissions.VENTA_LISTADO)
  
  if (!canAccess) return <NoAutorizado />

  return (
    <>
      <ModalPdfVentaWrapper />
      <ContenedorGeneral>
      <div className='w-full'>
        <Suspense fallback={<ComponentLoading />}>
          <FiltersMisVentas />
        </Suspense>
        
        {/* Layout responsivo similar a Mi Almacén */}
        <div className='w-full mt-4'>
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8'>
            {/* Columna principal - Tablas */}
            <div className='flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0'>
              <div className='h-[300px]'>
                <Suspense fallback={<ComponentLoading />}>
                  <TableMisVentas />
                </Suspense>
              </div>
              <div>
                <Suspense fallback={<ComponentLoading />}>
                  <TableDetalleVenta />
                </Suspense>
              </div>
            </div>

            {/* Columna lateral - Cards (Solo Desktop) */}
            <div className='hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]'>
              <Suspense fallback={<Spin />}>
                <CardsInfoVentas />
              </Suspense>
            </div>
          </div>

          {/* Cards de información - Móvil/Tablet: Abajo en grid */}
          <div className='lg:hidden mt-4'>
            <Suspense fallback={<Spin />}>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <CardsInfoVentas />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
    </>
  )
}
