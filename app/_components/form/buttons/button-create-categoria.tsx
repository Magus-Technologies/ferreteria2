import { Tooltip } from 'antd'
import { useState } from 'react'
import { createCategoria } from '~/app/_actions/categoria'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName, {
  GenericFormWithName,
} from '~/components/modals/modal-form-with-name'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'

interface ButtonCreateCategoriaProps {
  className?: string
  onSuccess?: (res: GenericFormWithName) => void
}

export default function ButtonCreateCategoria({
  className,
  onSuccess,
}: ButtonCreateCategoriaProps) {
  const [open, setOpen] = useState(false)

  const can = usePermission()
  if (!can(permissions.CATEGORIA_CREATE)) return null

  return (
    <>
      <FormWithName
        title='Categoría'
        open={open}
        setOpen={setOpen}
        propsUseServerMutation={{
          action: createCategoria,
          queryKey: [QueryKeys.CATEGORIAS],
          onSuccess: res => onSuccess?.(res.data!),
          msgSuccess: 'Categoría creada exitosamente',
        }}
      />
      <Tooltip title='Crear Categoría'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
