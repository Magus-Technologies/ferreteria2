'use client'

import { FaGift } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import TituloModulos from '~/app/_components/others/titulo-modulos'
import ButtonBase from '~/components/buttons/button-base'
import { IoArrowBack } from 'react-icons/io5'

export default function HeaderCrearVale() {
  const router = useRouter()

  return (
    <TituloModulos
      title='Crear Vale de Compra'
      icon={<FaGift className='text-amber-600' />}
      extra={
        <div className='pl-8 flex items-center gap-4'>
          <ButtonBase
            color='default'
            size='md'
            onClick={() => router.push('/ui/facturacion-electronica/vales-compra')}
            className='flex items-center gap-2'
          >
            <IoArrowBack />
            Volver a la lista
          </ButtonBase>
        </div>
      }
    />
  )
}
