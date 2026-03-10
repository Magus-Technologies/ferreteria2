'use client'

import { useState } from 'react'
import { BsFillCartXFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'
import ModalVentasAnuladas from '../modals/modal-ventas-anuladas'

export default function ButtonRecuperarVentaAnulada() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ModalVentasAnuladas open={open} setOpen={setOpen} />
      <ButtonBase
        className='flex items-center justify-center gap-4 !rounded-md w-full h-full text-balance border-red-500'
        onClick={() => setOpen(true)}
      >
        <BsFillCartXFill className='text-red-600 min-w-fit' size={30} />
        Recuperar Venta Anulada
      </ButtonBase>
    </>
  )
}
