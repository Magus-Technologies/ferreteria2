'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const FiltersMisGuias = lazy(() => import('./_components/filters/filters-mis-guias'))
const TableMisGuias = lazy(() => import('./_components/tables/table-mis-guias'))
const TableDetalleGuia = lazy(() => import('./_components/tables/table-detalle-guia'))
const CardsInfoGuias = lazy(() => import('./_components/others/cards-info-guias'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisGuias() {
  // TODO: Descomentar cuando los permisos estén configurados en la BD
  // const canAccess = usePermission(permissions.GUIA_LISTADO)
  // if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <Suspense fallback={<ComponentLoading />}>
          <FiltersMisGuias />
        </Suspense>
        
        {/* Layout responsivo similar a Mis Ventas */}
        <div className='w-full mt-4'>
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8'>
            {/* Columna principal - Tablas */}
            <div className='flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0'>
              <div className='h-[300px]'>
                <Suspense fallback={<ComponentLoading />}>
                  <TableMisGuias />
                </Suspense>
              </div>
              <div>
                <Suspense fallback={<ComponentLoading />}>
                  <TableDetalleGuia />
                </Suspense>
              </div>
            </div>

            {/* Columna lateral - Cards (Solo Desktop) */}
            <div className='hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]'>
              <Suspense fallback={<Spin />}>
                <CardsInfoGuias />
              </Suspense>
            </div>
          </div>

          {/* Cards de información - Móvil/Tablet: Abajo en grid */}
          <div className='lg:hidden mt-4'>
            <Suspense fallback={<Spin />}>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <CardsInfoGuias />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
