'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const FiltersMisCompras = lazy(() => import('./_components/filters/filters-mis-compras'))
const TableMisCompras = lazy(() => import('./_components/tables/table-mis-compras'))
const TableDetalleDeCompraMisCompras = lazy(() => import('./_components/tables/table-detalle-de-compra-mis-compras'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisCompras() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_COMPRAS_INDEX)
  
  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <Suspense fallback={<ComponentLoading />}>
        <FiltersMisCompras />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <TableMisCompras />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <TableDetalleDeCompraMisCompras />
      </Suspense>
    </ContenedorGeneral>
  )
}
