'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const BodyVender = lazy(() => import('./_components/others/body-vender'))
const HeaderCrearVenta = lazy(() => import('./_components/others/header-crear-venta'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function CrearVenta() {
  const canAccess = usePermission(permissions.VENTA_CREATE)
  
  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <Suspense fallback={<ComponentLoading />}>
        <HeaderCrearVenta />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <BodyVender />
      </Suspense>
    </ContenedorGeneral>
  )
}
