'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const TableRecepcionesAlmacen = lazy(() => import('./_components/tables/table-recepciones-almacen'))
const FiltersMisRecepciones = lazy(() => import('./_components/filters/filters-mis-recepciones'))
const TableDetalleDeRecepcion = lazy(() => import('./_components/tables/table-detalle-de-recepcion'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisRecepciones() {
  const canAccess = usePermission(permissions.GESTION_COMERCIAL_E_INVENTARIO_MIS_RECEPCIONES_INDEX)
  
  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <Suspense fallback={<ComponentLoading />}>
        <FiltersMisRecepciones />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <TableRecepcionesAlmacen />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <TableDetalleDeRecepcion />
      </Suspense>
    </ContenedorGeneral>
  )
}
