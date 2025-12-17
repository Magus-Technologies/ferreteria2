'use client'

import { FormInstance } from 'antd'
import { FormCreateCotizacion } from '../others/body-cotizar'
import CardInfoCotizacion from './card-info-cotizacion'
import ButtonBase from '~/components/buttons/button-base'
import { FaSave, FaPrint } from 'react-icons/fa'

export default function CardsInfoCotizacion({
  form,
}: {
  form: FormInstance<FormCreateCotizacion>
}) {
  return (
    <div className='flex flex-col gap-4 min-w-[280px]'>
      <CardInfoCotizacion form={form} />
      
      <div className='flex flex-col gap-2'>
        <ButtonBase
          type='submit'
          color='success'
          size='lg'
          className='w-full flex items-center justify-center gap-2'
        >
          <FaSave />
          Guardar Cotización
        </ButtonBase>
        
        <ButtonBase
          type='button'
          color='info'
          size='lg'
          className='w-full flex items-center justify-center gap-2'
          onClick={() => {
            // Lógica para imprimir
            console.log('Imprimir cotización')
          }}
        >
          <FaPrint />
          Imprimir
        </ButtonBase>
      </div>
    </div>
  )
}
