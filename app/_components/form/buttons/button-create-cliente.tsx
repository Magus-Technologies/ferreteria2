import { Tooltip } from 'antd'
import { useState } from 'react'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import { Cliente } from '~/lib/api/cliente'
import ModalCreateCliente from '~/app/ui/facturacion-electronica/mis-ventas/_components/modals/modal-create-cliente'

interface ButtonCreateClienteProps {
  className?: string
  onSuccess?: (res: Cliente) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
}

export default function ButtonCreateCliente({
  className,
  onSuccess,
  textDefault,
  setTextDefault,
}: ButtonCreateClienteProps) {
  const [open, setOpen] = useState(false)

  const { can } = usePermissionHook()
  if (!can(permissions.CLIENTE_CREATE)) return null

  return (
    <>
      <ModalCreateCliente
        open={open}
        setOpen={setOpen}
        onSuccess={onSuccess}
        textDefault={textDefault}
        setTextDefault={setTextDefault}
      />
      <Tooltip title='Crear Cliente'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
