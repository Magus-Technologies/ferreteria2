'use client'

import { Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormWithName, {
  ModalFormWithNameRef,
} from '~/components/modals/modal-form-with-name'
import usePermission from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import { useStoreAlmacen } from '~/store/store-almacen'
import InputNumberBase from '../inputs/input-number-base'
import { createUbicacion } from '~/app/_actions/ubicacion'

interface ButtonCreateUbicacionProps {
  className?: string
}

export default function ButtonCreateUbicacion({
  className,
}: ButtonCreateUbicacionProps) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<ModalFormWithNameRef<{
    name: string
    almacen_id: number
  }> | null>(null)

  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  useEffect(() => {
    if (formRef.current) formRef.current.setFieldValue('almacen_id', almacen_id)
  }, [almacen_id])

  const can = usePermission()
  if (!can(permissions.UBICACION_CREATE)) return null

  return (
    <>
      <FormWithName
        title='Ubicación'
        open={open}
        setOpen={setOpen}
        propsUseServerMutation={{
          action: createUbicacion,
          queryKey: [QueryKeys.UBICACIONES],
          msgSuccess: 'Ubicación creada exitosamente',
        }}
      >
        <InputNumberBase
          propsForm={{
            name: 'almacen_id',
            initialValue: almacen_id,
            rules: [
              {
                required: true,
                message: '',
              },
            ],
            hidden: true,
          }}
        />
      </FormWithName>
      <Tooltip title='Crear Ubicación'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
