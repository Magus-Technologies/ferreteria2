'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes
const FiltersMisEntregas = lazy(() => import('./_components/filters/filters-mis-entregas'))
const TableMisEntregas = lazy(() => import('./_components/tables/table-mis-entregas'))
const CardsInfoEntregas = lazy(() => import('./_components/cards/cards-info-entregas'))

// Componente de loading
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisEntregas() {
  const canAccess = usePermission(permissions.FACTURACION_ELECTRONICA_MIS_ENTREGAS_INDEX)
  
  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <Suspense fallback={<ComponentLoading />}>
          <FiltersMisEntregas />
        </Suspense>
        
        {/* Layout responsivo */}
        <div className='w-full mt-4'>
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8'>
            {/* Columna principal - Tabla */}
            <div className='flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0'>
              <div className='h-[600px]'>
                <Suspense fallback={<ComponentLoading />}>
                  <TableMisEntregas />
                </Suspense>
              </div>
            </div>

            {/* Columna lateral - Cards (Solo Desktop) */}
            <div className='hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]'>
              <Suspense fallback={<Spin />}>
                <CardsInfoEntregas />
              </Suspense>
            </div>
          </div>

          {/* Cards de información - Móvil/Tablet: Abajo en grid */}
          <div className='lg:hidden mt-4'>
            <Suspense fallback={<Spin />}>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <CardsInfoEntregas />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
