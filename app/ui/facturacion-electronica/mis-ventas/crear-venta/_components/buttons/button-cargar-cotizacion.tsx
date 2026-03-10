'use client'

import { useState } from 'react'
import { HiDocumentText } from 'react-icons/hi2'
import ButtonBase from '~/components/buttons/button-base'
import ModalCotizaciones from '../modals/modal-cotizaciones'

export default function ButtonCargarCotizacion() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ModalCotizaciones open={open} setOpen={setOpen} />
      <ButtonBase
        className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-blue-500'
        onClick={() => setOpen(true)}
      >
        <HiDocumentText className='text-blue-600 min-w-fit' size={30} />
        Cargar Cotizacion
      </ButtonBase>
    </>
  )
}
