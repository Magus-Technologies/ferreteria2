'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Result, Spin } from 'antd'
import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import ButtonBase from '~/components/buttons/button-base'

export default function EditarValeRedirectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const valeId = searchParams.get('id')

  useEffect(() => {
    if (valeId) {
      router.replace(`/ui/facturacion-electronica/vales-compra/editar-vale/${valeId}`)
    }
  }, [router, valeId])

  if (!valeId) {
    return (
      <ContenedorGeneral className='h-full'>
        <Result
          status='warning'
          title='Vale invalido'
          subTitle='No se encontro un identificador para editar.'
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
    <ContenedorGeneral className='h-full flex items-center justify-center'>
      <Spin size='large' tip='Redirigiendo a la edicion del vale...' fullscreen={false}>
        <div className='p-12' />
      </Spin>
    </ContenedorGeneral>
  )
}
