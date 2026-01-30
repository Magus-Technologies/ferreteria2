'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import ProgressiveLoader from '~/app/_components/others/progressive-loader'
import ConfigurableElement from '~/app/ui/configuracion/permisos-visuales/_components/configurable-element'

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

      {/* Layout responsivo */}
      <div className="w-full mt-4">
        <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 min-w-0">
          <ConfigurableElement componentId="gestion-comercial.mis-compras.tabla-compras" label="Tabla de Compras">
            <div className="h-[250px]">
              <ProgressiveLoader
                identifier="mis-compras-table-compras"
                priority="critical"
              >
                <Suspense fallback={<ComponentLoading />}>
                  <TableMisCompras />
                </Suspense>
              </ProgressiveLoader>
            </div>
          </ConfigurableElement>
          <ConfigurableElement componentId="gestion-comercial.mis-compras.tabla-detalle-compra" label="Tabla Detalle de Compra">
            <div className="h-[200px]">
              <ProgressiveLoader
                identifier="mis-compras-detalle-compra"
                priority="medium"
                delay={800}
              >
                <Suspense fallback={<ComponentLoading />}>
                  <TableDetalleDeCompraMisCompras />
                </Suspense>
              </ProgressiveLoader>
            </div>
          </ConfigurableElement>
        </div>
      </div>
    </ContenedorGeneral>
  )
}
