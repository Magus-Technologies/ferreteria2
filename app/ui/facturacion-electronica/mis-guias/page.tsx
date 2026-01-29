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
        <div className='mt-4 w-full'>
          <Suspense fallback={<ComponentLoading />}>
            <TableMisGuias />
          </Suspense>
          <Suspense fallback={<ComponentLoading />}>
            <TableDetalleGuia />
          </Suspense>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
