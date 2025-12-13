'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const FiltersMisVentas = lazy(() => import('./_components/filters/filters-mis-ventas'))
const TableMisVentas = lazy(() => import('./_components/tables/table-mis-ventas'))
const TableDetalleVenta = lazy(() => import('./_components/tables/table-detalle-venta'))

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
    <ContenedorGeneral>
      <div className='w-full'>
        <Suspense fallback={<ComponentLoading />}>
          <FiltersMisVentas />
        </Suspense>
        <div className='mt-4 w-full'>
          <Suspense fallback={<ComponentLoading />}>
            <TableMisVentas />
          </Suspense>
          <Suspense fallback={<ComponentLoading />}>
            <TableDetalleVenta />
          </Suspense>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
