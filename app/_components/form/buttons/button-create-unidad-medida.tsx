import { Tooltip } from 'antd'
import { useState } from 'react'
import { createUnidadMedida } from '~/app/_actions/unidadMedida'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName, {
  GenericFormWithName,
} from '~/components/modals/modal-form-with-name'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'

interface ButtonCreateUnidadMedidaProps {
  className?: string
  onSuccess?: (res: GenericFormWithName) => void
}

export default function ButtonCreateUnidadMedida({
  className,
  onSuccess,
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
          onSuccess: res => onSuccess?.(res.data!),
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
