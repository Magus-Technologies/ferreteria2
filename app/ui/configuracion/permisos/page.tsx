'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const TablePermisos = lazy(() => import('./_components/tables/table-permisos'))
const CardsInfoPermisos = lazy(() => import('./_components/cards/cards-info-permisos'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function PermisosPage() {
  const canAccess = usePermission(permissions.CONFIGURACION_PERMISOS_INDEX)
  
  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        {/* Layout responsivo similar a Mis Ventas */}
        <div className='w-full'>
          <div className='grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 sm:gap-5 md:gap-6 lg:gap-8'>
            {/* Columna principal - Tabla */}
            <div className='flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0'>
              <Suspense fallback={<ComponentLoading />}>
                <TablePermisos />
              </Suspense>
            </div>

            {/* Columna lateral - Cards (Solo Desktop) */}
            <div className='hidden lg:flex flex-col items-start gap-4 flex-nowrap min-w-[140px]'>
              <Suspense fallback={<Spin />}>
                <CardsInfoPermisos />
              </Suspense>
            </div>
          </div>

          {/* Cards de información - Móvil/Tablet: Abajo en grid */}
          <div className='lg:hidden mt-4'>
            <Suspense fallback={<Spin />}>
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                <CardsInfoPermisos />
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
