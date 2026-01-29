import { Tooltip } from 'antd'
import { useState } from 'react'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName, {
  GenericFormWithName,
} from '~/components/modals/modal-form-with-name'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import { unidadesDerivadas } from '~/lib/api/catalogos'

interface ButtonCreateUnidadDerivadaProps {
  className?: string
  onSuccess?: (res: GenericFormWithName) => void
}

export default function ButtonCreateUnidadDerivada({
  className,
  onSuccess,
}: ButtonCreateUnidadDerivadaProps) {
  const [open, setOpen] = useState(false)

  const { can } = usePermissionHook()
  if (!can(permissions.UNIDAD_DERIVADA_CREATE)) return null

  return (
    <>
      <FormWithName
        title='Unidad Derivada'
        open={open}
        setOpen={setOpen}
        propsUseServerMutation={{
          action: async (payload: { name: string }) => {
            const res = await unidadesDerivadas.create({ name: payload.name });
            if (res.error) throw new Error(res.error.message);
            return { data: res.data };
          },
          queryKey: [QueryKeys.UNIDADES_DERIVADAS],
          onSuccess: res => onSuccess?.(res.data!),
          msgSuccess: 'Unidad derivada creada exitosamente',
        }}
      />
      <Tooltip title='Crear Unidad Derivada'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
