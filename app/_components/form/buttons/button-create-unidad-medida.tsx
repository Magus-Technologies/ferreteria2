import { Tooltip } from 'antd'
import { useState } from 'react'
import { createUnidadMedida } from '~/app/_actions/unidadMedida'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName from '~/components/modals/modal-form-with-name'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'

interface ButtonCreateUnidadMedidaProps {
  className?: string
}

export default function ButtonCreateUnidadMedida({
  className,
}: ButtonCreateUnidadMedidaProps) {
  const [open, setOpen] = useState(false)

  const can = usePermission()
  if (!can(permissions.UNIDAD_MEDIDA_CREATE)) return null

  return (
    <>
      <FormWithName
        title='Unidad de Medida'
        open={open}
        setOpen={setOpen}
        propsUseServerMutation={{
          action: createUnidadMedida,
          queryKey: [QueryKeys.UNIDADES_MEDIDA],
          msgSuccess: 'Unidad de medida creada exitosamente',
        }}
      />
      <Tooltip title='Crear Unidad de Medida'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
