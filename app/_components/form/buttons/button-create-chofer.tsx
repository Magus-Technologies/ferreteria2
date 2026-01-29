'use client'

import { Tooltip } from 'antd'
import { useState } from 'react'
import { Chofer } from '~/lib/api/chofer'
import ModalCreateChofer from '../../modals/modal-create-chofer'
import ButtonCreateFormWithName from './button-create-form-with-name'

type ButtonCreateChoferProps = {
  onSuccess?: (chofer: Chofer) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
  className?: string
}

export default function ButtonCreateChofer({
  onSuccess,
  textDefault,
  setTextDefault,
  className,
}: ButtonCreateChoferProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ModalCreateChofer
        open={open}
        setOpen={setOpen}
        onSuccess={onSuccess}
        textDefault={textDefault}
        setTextDefault={setTextDefault}
      />
      <Tooltip title='Crear Chofer'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
