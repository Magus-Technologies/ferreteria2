'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Spin } from 'antd'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { cotizacionesApi } from '~/lib/api/cotizaciones'

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

// Dynamic imports con SSR deshabilitado
const BodyVender = dynamic(() => import('./_components/others/body-vender'), { ssr: false, loading: ComponentLoading })
const HeaderCrearVenta = dynamic(() => import('./_components/others/header-crear-venta'), { ssr: false, loading: ComponentLoading })

export default function CrearVenta() {
  const canAccess = usePermission(permissions.VENTA_CREATE)
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get('cotizacion')

  // Cargar cotización si existe el parámetro
  const { data: cotizacionData, isLoading } = useQuery({
    queryKey: ['cotizacion-para-venta', cotizacionId],
    queryFn: async () => {
      if (!cotizacionId) return null
      const response = await cotizacionesApi.getById(cotizacionId)
      return response.data?.data || null
    },
    enabled: !!cotizacionId,
  })
  
  if (!canAccess) return <NoAutorizado />

  // Mostrar loading mientras se carga la cotización
  if (cotizacionId && isLoading) {
    return (
      <ContenedorGeneral className='h-full'>
        <ComponentLoading />
      </ContenedorGeneral>
    )
  }

  return (
    <ContenedorGeneral className='h-full'>
        <HeaderCrearVenta />
        <BodyVender cotizacion={cotizacionData} />
    </ContenedorGeneral>
  )
}
