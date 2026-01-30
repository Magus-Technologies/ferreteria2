import { Tooltip } from 'antd'
import { useState } from 'react'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import type { MotivoTraslado } from '~/lib/api/motivo-traslado'
import ModalCreateMotivoTraslado from '~/app/ui/facturacion-electronica/mis-guias/_components/modals/modal-create-motivo-traslado'

interface ButtonCreateMotivoTrasladoProps {
  className?: string
  onSuccess?: (res: MotivoTraslado) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
}

export default function ButtonCreateMotivoTraslado({
  className,
  onSuccess,
  textDefault,
  setTextDefault,
}: ButtonCreateMotivoTrasladoProps) {
  const [open, setOpen] = useState(false)

  const { can } = usePermissionHook()
  if (!can(permissions.GUIA_CREATE)) return null

  return (
    <>
      <ModalCreateMotivoTraslado
        open={open}
        setOpen={setOpen}
        onSuccess={onSuccess}
        textDefault={textDefault}
        setTextDefault={setTextDefault}
      />
      <Tooltip title='Crear Motivo de Traslado'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
