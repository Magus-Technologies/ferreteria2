'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import { useSearchParams } from 'next/navigation'

// Lazy loading de componentes pesados
const HeaderCrearCompra = lazy(() => import('./_components/others/header'))
const BodyComprar = lazy(() => import('./_components/others/body-comprar'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function CrearCompra() {
  const canAccess = usePermission(permissions.COMPRAS_CREATE)
  const searchParams = useSearchParams()
  const ordenCompraId = searchParams.get('orden_compra_id')
    ? Number(searchParams.get('orden_compra_id'))
    : undefined

  if (!canAccess) return <NoAutorizado />

  return (
    <ContenedorGeneral className='h-full'>
      <Suspense fallback={<ComponentLoading />}>
        <HeaderCrearCompra />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <BodyComprar ordenCompraId={ordenCompraId} />
      </Suspense>
    </ContenedorGeneral>
  )
}
