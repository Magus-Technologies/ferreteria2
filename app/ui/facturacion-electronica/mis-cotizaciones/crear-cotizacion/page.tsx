'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
// import NoAutorizado from '~/components/others/no-autorizado'
// import { permissions } from '~/lib/permissions'
// import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const BodyCotizar = lazy(() => import('./_components/others/body-cotizar'))
const HeaderCrearCotizacion = lazy(() => import('./_components/others/header-crear-cotizacion'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function CrearCotizacion() {
  // TODO: Descomentar cuando agregues los permisos en la BD
  // const canAccess = usePermission(permissions.COTIZACION_CREATE)
  // if (!canAccess) return <NoAutorizado />
  // const canAccess = true // Temporal para desarrollo

  return (
    <ContenedorGeneral>
      <Suspense fallback={<ComponentLoading />}>
        <HeaderCrearCotizacion />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <BodyCotizar />
      </Suspense>
    </ContenedorGeneral>
  )
}
