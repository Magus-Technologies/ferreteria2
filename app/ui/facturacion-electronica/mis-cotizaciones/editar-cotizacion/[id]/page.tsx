'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'
import { useParams } from 'next/navigation'

// Lazy loading de componentes pesados
const BodyEditarCotizacion = lazy(() => import('./_components/others/body-editar-cotizacion'))
const HeaderEditarCotizacion = lazy(() => import('./_components/others/header-editar-cotizacion'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function EditarCotizacion() {
  const params = useParams()
  const id = params.id as string

  return (
    <ContenedorGeneral className='h-full'>
      <Suspense fallback={<ComponentLoading />}>
        <HeaderEditarCotizacion />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <BodyEditarCotizacion cotizacionId={id} />
      </Suspense>
    </ContenedorGeneral>
  )
}
