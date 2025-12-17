'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
// import NoAutorizado from '~/components/others/no-autorizado'
// import { permissions } from '~/lib/permissions'
// import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const FiltersMisCotizaciones = lazy(() => import('./_components/filters/filters-mis-cotizaciones'))
const TableMisCotizaciones = lazy(() => import('./_components/tables/table-mis-cotizaciones'))
const TableDetalleCotizacion = lazy(() => import('./_components/tables/table-detalle-cotizacion'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisCotizaciones() {
  // TODO: Descomentar cuando agregues los permisos en la BD
  // const canAccess = usePermission(permissions.COTIZACION_LISTADO)
  // if (!canAccess) return <NoAutorizado />
  // const canAccess = true // Temporal para desarrollo

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <Suspense fallback={<ComponentLoading />}>
          <FiltersMisCotizaciones />
        </Suspense>
        <div className='mt-4 w-full'>
    <Suspense fallback={<ComponentLoading />}>
            <TableMisCotizaciones />
          </Suspense> 
       <Suspense fallback={<ComponentLoading />}>
            <TableDetalleCotizacion />
          </Suspense> 
        </div>
      </div>
    </ContenedorGeneral>
  )
}
