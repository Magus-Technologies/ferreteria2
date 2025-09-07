'use client'

import ButtonBase from '~/components/buttons/button-base'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import ModalCreateIngresoSalida from '../modals/modal-create-ingreso-salida'
import { useState } from 'react'
import { IngresoSalidaEnum } from '~/app/_lib/tipos-ingresos-salidas'

interface ButtonCreateIngresoSalidaProps {
  tipo: IngresoSalidaEnum
}

export default function ButtonCreateIngresoSalida({
  tipo,
}: ButtonCreateIngresoSalidaProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ModalCreateIngresoSalida tipo={tipo} open={open} setOpen={setOpen} />
      <ButtonBase
        className='flex items-center justify-center gap-2 !rounded-md w-full h-full'
        onClick={() => setOpen(true)}
      >
        {tipo === IngresoSalidaEnum.ingreso ? (
          <GiReceiveMoney className='text-orange-600' size={15} />
        ) : (
          <GiPayMoney className='text-rose-600' size={15} />
        )}
        {tipo === IngresoSalidaEnum.ingreso ? 'Ingresos' : 'Salidas'}
      </ButtonBase>
    </>
  )
}
