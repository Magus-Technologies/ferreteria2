import { Tooltip } from 'antd'
import { useState } from 'react'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import { Proveedor } from '@prisma/client'
import ModalCreateProveedor from '~/app/ui/gestion-comercial-e-inventario/mis-proveedores/_components/modals/modal-create-proveedor'

interface ButtonCreateProveedorProps {
  className?: string
  onSuccess?: (res: Proveedor) => void
}

export default function ButtonCreateProveedor({
  className,
  onSuccess,
}: ButtonCreateProveedorProps) {
  const [open, setOpen] = useState(false)

  const can = usePermission()
  if (!can(permissions.MARCA_CREATE)) return null

  return (
    <>
      <ModalCreateProveedor
        open={open}
        setOpen={setOpen}
        onSuccess={onSuccess}
      />
      <Tooltip title='Crear Proveedor'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
