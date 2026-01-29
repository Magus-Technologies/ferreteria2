import { Tooltip } from 'antd'
import { useState } from 'react'
import { unidadesMedidaApi } from '~/lib/api/catalogos'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName, {
  GenericFormWithName,
} from '~/components/modals/modal-form-with-name'
import usePermissionHook from '~/hooks/use-permission'
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

  const { can } = usePermissionHook()
  if (!can(permissions.UNIDAD_MEDIDA_CREATE)) return null

  return (
    <>
      <FormWithName
        title='Unidad de Medida'
        open={open}
        setOpen={setOpen}
        propsUseServerMutation={{
          action: async (payload: { name: string }) => {
            const res = await unidadesMedidaApi.create({ name: payload.name });
            if (res.error) throw new Error(res.error.message);
            return { data: res.data };
          },
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
