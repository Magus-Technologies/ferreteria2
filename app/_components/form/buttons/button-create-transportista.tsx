'use client'

import { Tooltip } from 'antd'
import { useState } from 'react'
import { Transportista } from '~/lib/api/transportista'
import ModalCreateTransportista from '../../modals/modal-create-transportista'
import ButtonCreateFormWithName from './button-create-form-with-name'

type ButtonCreateTransportistaProps = {
  onSuccess?: (transportista: Transportista) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
  className?: string
}

export default function ButtonCreateTransportista({
  onSuccess,
  textDefault,
  setTextDefault,
  className,
}: ButtonCreateTransportistaProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ModalCreateTransportista
        open={open}
        setOpen={setOpen}
        onSuccess={onSuccess}
        textDefault={textDefault}
        setTextDefault={setTextDefault}
      />
      <Tooltip title='Crear Transportista'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
