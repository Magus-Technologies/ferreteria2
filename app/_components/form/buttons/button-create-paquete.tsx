import { Tooltip } from 'antd'
import { useState } from 'react'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import ModalCrearEditarPaquete from '~/app/_components/modals/modal-crear-editar-paquete'

interface ButtonCreatePaqueteProps {
  className?: string
  onSuccess?: () => void
}

export default function ButtonCreatePaquete({
  className,
  onSuccess,
}: ButtonCreatePaqueteProps) {
  const [open, setOpen] = useState(false)

  const { can } = usePermissionHook()
  if (!can(permissions.PRODUCTO_CREATE)) return null

  return (
    <>
      <ModalCrearEditarPaquete
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={() => {
          onSuccess?.()
          setOpen(false)
        }}
      />
      <Tooltip title='Crear Paquete'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
