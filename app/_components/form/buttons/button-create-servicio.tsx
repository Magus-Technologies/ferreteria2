import { Tooltip } from 'antd'
import { useState } from 'react'
import ButtonCreateFormWithName from './button-create-form-with-name'
import ModalCrearServicio from '~/app/_components/modals/modal-crear-servicio'

interface ButtonCreateServicioProps {
  className?: string
  onSuccess?: () => void
}

export default function ButtonCreateServicio({
  className,
  onSuccess,
}: ButtonCreateServicioProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ModalCrearServicio
        open={open}
        setOpen={setOpen}
        onCreated={() => {
          onSuccess?.()
        }}
      />
      <Tooltip title='Crear Servicio'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
