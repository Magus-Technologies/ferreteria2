'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { BsFillCartDashFill } from 'react-icons/bs'
import ButtonBase from '~/components/buttons/button-base'

const ModalVentasEnEspera = dynamic(() => import('../modals/modal-ventas-en-espera'), { ssr: false })

export default function ButtonRecuperarVentaEnEspera() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && <ModalVentasEnEspera open={open} setOpen={setOpen} />}
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
