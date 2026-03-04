'use client'

import { useState } from 'react'
import { BsFillCartDashFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import ModalVentasEnEspera from '../modals/modal-ventas-en-espera'

export default function ButtonRecuperarVentaEnEspera() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ModalVentasEnEspera open={open} setOpen={setOpen} />
      <ButtonBase
        className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-yellow-500'
        onClick={() => setOpen(true)}
      >
        <BsFillCartDashFill className='text-yellow-600 min-w-fit' size={30} />
        Recuperar Venta en Espera
      </ButtonBase>
    </>
  )
}
