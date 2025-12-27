'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'

import { Suspense, lazy } from 'react'
import { Spin } from 'antd'


// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

export default function MisCotizaciones() {
  // TODO: Descomentar cuando agregues los permisos en la BD
  // const canAccess = usePermission(permissions.COTIZACION_LISTADO)
  // if (!canAccess) return <NoAutorizado />
  // const canAccess = true // Temporal para desarrollo

  return (
    <ContenedorGeneral>
      <div className='w-full'>
        <Suspense fallback={<ComponentLoading />}>
    
        </Suspense>
        <div className='mt-4 w-full'>
    <Suspense fallback={<ComponentLoading />}>
          
          </Suspense> 
       <Suspense fallback={<ComponentLoading />}>
     
          </Suspense> 
        </div>
      </div>
    </ContenedorGeneral>
  )
}
