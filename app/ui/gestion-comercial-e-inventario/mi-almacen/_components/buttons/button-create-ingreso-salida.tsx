'use client'

import ButtonBase from '~/components/buttons/button-base'
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi'
import ModalCreateIngresoSalida from '../modals/modal-create-ingreso-salida'
import { useState } from 'react'
import { TipoDocumento } from '@prisma/client'

interface ButtonCreateIngresoSalidaProps {
  tipo: TipoDocumento
}

export default function ButtonCreateIngresoSalida({
  tipo,
}: ButtonCreateIngresoSalidaProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <ModalCreateIngresoSalida
        tipo_documento={tipo}
        open={open}
        setOpen={setOpen}
      />
      <ButtonBase
        className='flex items-center justify-center gap-2 !rounded-md w-full lg:h-full h-10'
        size='sm'
        onClick={() => setOpen(true)}
      >
        {tipo === TipoDocumento.Ingreso ? (
          <GiReceiveMoney className='text-orange-600' size={15} />
        ) : (
          <GiPayMoney className='text-rose-600' size={15} />
        )}
        {tipo === TipoDocumento.Ingreso ? 'Ingresos' : 'Salidas'}
      </ButtonBase>
    </>
  )
}
