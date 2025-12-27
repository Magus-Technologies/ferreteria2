'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import { Suspense, lazy } from 'react'
import { Spin } from 'antd'

// Lazy loading de componentes pesados
const BodyCrearPrestamo = lazy(() => import('./_components/others/body-crear-prestamo'))
const HeaderCrearPrestamo = lazy(() => import('./_components/others/header-crear-prestamo'))

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function CrearPrestamo() {
  return (
    <ContenedorGeneral>
      <Suspense fallback={<ComponentLoading />}>
        <HeaderCrearPrestamo />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <BodyCrearPrestamo />
      </Suspense>
    </ContenedorGeneral>
  )
}
