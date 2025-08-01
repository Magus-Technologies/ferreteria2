import { Tooltip } from 'antd'
import { useState } from 'react'
import { createCategoria } from '~/app/_actions/categoria'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName from '~/components/modals/modal-form-with-name'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'

interface ButtonCreateCategoriaProps {
  className?: string
}

export default function ButtonCreateCategoria({
  className,
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
