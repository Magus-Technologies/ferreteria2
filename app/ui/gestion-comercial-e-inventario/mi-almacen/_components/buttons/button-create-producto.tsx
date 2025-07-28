'use client'

import ButtonBase from '~/components/buttons/button-base'
import ModalCreateProducto from '../modals/modal-create-producto'
import { FaPlusCircle } from 'react-icons/fa'
import { useState } from 'react'

export default function ButtonCreateProducto() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ModalCreateProducto open={open} setOpen={setOpen} />
      <ButtonBase
        className='flex items-center justify-center gap-2 !rounded-md w-full h-full'
        onClick={() => setOpen(true)}
      >
        <FaPlusCircle className='text-emerald-600' size={15} /> Agregar
      </ButtonBase>
    </>
  )
}
