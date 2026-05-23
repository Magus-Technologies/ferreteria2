'use client'

import { Suspense, lazy } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Result, Spin } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import ButtonBase from '~/components/buttons/button-base'
import { getValeCompraById } from '~/lib/api/vales-compra'

const BodyEditarVale = lazy(() => import('../_components/others/body-editar-vale'))
const HeaderEditarVale = lazy(() => import('../_components/others/header-editar-vale'))

const ComponentLoading = () => (
  <div className='flex items-center justify-center h-40'>
    <Spin size='large' />
  </div>
)

export default function EditarValePage() {
  const params = useParams()
  const router = useRouter()
  const valeId = Number(params?.id)

  const {
    data: vale,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['vale-compra', valeId],
    queryFn: async () => {
      const result = await getValeCompraById(valeId)

      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'Error al cargar el vale')
      }

      return result.data
    },
    enabled: Number.isFinite(valeId) && valeId > 0,
  })

  if (!Number.isFinite(valeId) || valeId <= 0) {
    return (
      <ContenedorGeneral className='h-full'>
        <Result
          status='warning'
          title='Vale invalido'
          subTitle='El identificador del vale no es valido.'
          extra={
            <ButtonBase
              color='info'
              onClick={() => router.push('/ui/facturacion-electronica/vales-compra')}
            >
              Volver a vales
            </ButtonBase>
          }
        />
      </ContenedorGeneral>
    )
  }

  if (isLoading) {
    return (
      <ContenedorGeneral className='h-full'>
        <ComponentLoading />
      </ContenedorGeneral>
    )
  }

  if (error || !vale) {
    return (
      <ContenedorGeneral className='h-full'>
        <Result
          status='error'
          title='No se pudo cargar el vale'
          subTitle={error instanceof Error ? error.message : 'Intenta nuevamente.'}
          extra={
            <ButtonBase
              color='info'
              onClick={() => router.push('/ui/facturacion-electronica/vales-compra')}
            >
              Volver a vales
            </ButtonBase>
          }
        />
      </ContenedorGeneral>
    )
  }

  return (
    <ContenedorGeneral className='h-full'>
      <Suspense fallback={<ComponentLoading />}>
        <HeaderEditarVale />
      </Suspense>
      <Suspense fallback={<ComponentLoading />}>
        <BodyEditarVale vale={vale} />
      </Suspense>
    </ContenedorGeneral>
  )
}
