'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const BodyCrearGuia = lazy(() => import('./_components/others/body-crear-guia'))
const HeaderCrearGuia = lazy(() => import('./_components/others/header-crear-guia'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function CrearGuia() {
  // TODO: Descomentar cuando los permisos estén configurados en la BD
  // const canAccess = usePermission(permissions.GUIA_CREATE)
  // if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral>
      <Suspense fallback={<ComponentLoading />}>
        <HeaderCrearGuia />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <BodyCrearGuia />
      </Suspense>
    </ContenedorGeneral>
  )
}
