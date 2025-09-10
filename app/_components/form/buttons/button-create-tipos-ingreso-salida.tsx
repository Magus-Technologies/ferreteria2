import { Tooltip } from 'antd'
import { useState } from 'react'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName, {
  GenericFormWithName,
} from '~/components/modals/modal-form-with-name'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import { createTipoIngresoSalida } from '~/app/_actions/tipos-ingreso-salida'

interface ButtonCreateTiposIngresoSalidaProps {
  className?: string
  onSuccess?: (res: GenericFormWithName) => void
}

export default function ButtonCreateTiposIngresoSalida({
  className,
  onSuccess,
}: ButtonCreateTiposIngresoSalidaProps) {
  const [open, setOpen] = useState(false)

  const can = usePermission()
  if (!can(permissions.TIPO_INGRESO_SALIDA_CREATE)) return null

  return (
    <>
      <FormWithName
        title='Tipo Ingreso/Salida'
        open={open}
        setOpen={setOpen}
        propsUseServerMutation={{
          action: createTipoIngresoSalida,
          queryKey: [QueryKeys.TIPOS_INGRESO_SALIDA],
          onSuccess: res => onSuccess?.(res.data!),
          msgSuccess: 'Tipo Ingreso/Salida creado exitosamente',
        }}
      />
      <Tooltip title='Crear Tipo Ingreso/Salida'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
