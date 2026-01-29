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
      
      {/* Layout con alturas definidas para las tablas */}
      <div className="w-full mt-4 flex flex-col gap-4 sm:gap-5 md:gap-6">
        {/* Tabla principal de recepciones */}
        <div className="h-[300px]">
          <Suspense fallback={<ComponentLoading />}>
            <TableRecepcionesAlmacen />
          </Suspense>
        </div>
        
        {/* Tabla de detalle de recepción */}
        <div className="h-[250px]">
          <Suspense fallback={<ComponentLoading />}>
            <TableDetalleDeRecepcion />
          </Suspense>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
