'use client'

import { App, Form, Input, Tooltip } from 'antd'
import { useState } from 'react'
import { QueryKeys } from '~/app/_lib/queryKeys'
import usePermissionHook from '~/hooks/use-permission'
import { permissions } from '~/lib/permissions'
import ButtonCreateFormWithName from './button-create-form-with-name'
import { useStoreAlmacen } from '~/store/store-almacen'
import { ubicacionesApi, type Ubicacion } from '~/lib/api/catalogos'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import LabelBase from '~/components/form/label-base'

interface ButtonCreateUbicacionProps {
  className?: string
  onSuccess?: (res: Ubicacion) => void
}

export default function ButtonCreateUbicacion({
  className,
  onSuccess,
}: ButtonCreateUbicacionProps) {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const { message } = App.useApp()
  const queryClient = useQueryClient()
  const almacen_id = useStoreAlmacen(store => store.almacen_id)

  const createMutation = useMutation({
    mutationFn: async (values: { name: string }) => {
      if (!almacen_id) {
        throw new Error('No se ha seleccionado un almacén')
      }

      const response = await ubicacionesApi.create({
        name: values.name,
        almacen_id,
      })
      
      if (response.error) {
        throw new Error(response.error.message)
      }
      
      return response.data!
    },
    onSuccess: (data) => {
      message.success('Ubicación creada exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.UBICACIONES] })
      form.resetFields()
      setOpen(false)
      onSuccess?.(data)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al crear la ubicación')
    },
  })

  const handleSubmit = (values: { name: string }) => {
    createMutation.mutate(values)
  }

  const { can } = usePermissionHook()
  if (!can(permissions.UBICACION_CREATE)) return null

  return (
    <>
      <ModalForm
        modalProps={{
          title: <TitleForm>Crear Ubicación</TitleForm>,
          width: 500,
          centered: true,
          okText: 'Crear',
          confirmLoading: createMutation.isPending,
        }}
        open={open}
        setOpen={setOpen}
        onCancel={() => {
          form.resetFields()
        }}
        formProps={{
          form,
          onFinish: handleSubmit,
          layout: 'vertical',
        }}
      >
        <LabelBase label="*Nombre:" orientation="column">
          <Form.Item
            name="name"
            rules={[
              { required: true, message: 'El nombre es requerido' },
              { min: 2, message: 'Mínimo 2 caracteres' },
              { max: 191, message: 'Máximo 191 caracteres' },
            ]}
            noStyle
          >
            <Input placeholder="Ej: Estante A1, Pasillo 3, etc." />
          </Form.Item>
        </LabelBase>
      </ModalForm>

      <Tooltip title='Crear Ubicación'>
        <ButtonCreateFormWithName
          onClick={() => setOpen(true)}
          className={className}
        />
      </Tooltip>
    </>
  )
}
