'use client'

import { Form, Tooltip } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { MdDriveFileRenameOutline } from 'react-icons/md'
import InputBase from '~/app/_components/form/inputs/input-base'
import { QueryKeys } from '~/app/_lib/queryKeys'
import TitleForm from '~/components/form/title-form'
import LabelBase from '~/components/form/label-base'
import ModalForm from '~/components/modals/modal-form'
import { profesionesApi, type Profesion } from '~/lib/api/profesion'
import ButtonCreateFormWithName from './button-create-form-with-name'
import useApp from 'antd/es/app/useApp'

interface FormValues {
  nombre: string
}

export default function ButtonCreateProfesion({
  className,
  onSuccess,
}: {
  className?: string
  onSuccess?: (profesion: Profesion) => void
}) {
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm<FormValues>()
  const queryClient = useQueryClient()
  const { notification } = useApp()

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await profesionesApi.create(values.nombre)
      if (res.error || !res.data?.data) {
        throw new Error(res.error?.message || 'Error al crear profesión')
      }
      return res.data.data
    },
    onSuccess: (profesion) => {
      notification.success({
        message: 'Operación exitosa',
        description: 'Profesión creada exitosamente',
      })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.PROFESIONES] })
      setOpen(false)
      form.resetFields()
      onSuccess?.(profesion)
    },
    onError: (error: Error) => {
      notification.error({
        message: 'Error',
        description: error.message,
      })
    },
  })

  return (
    <>
      <ModalForm
        modalProps={{
          title: <TitleForm>Profesión</TitleForm>,
          className: 'w-[95vw] xl:w-auto xl:min-w-[400px]',
          wrapClassName: '!flex !items-center',
          centered: true,
          okButtonProps: { loading: mutation.isPending, disabled: mutation.isPending },
          okText: 'Crear',
        }}
        onCancel={() => form.resetFields()}
        open={open}
        setOpen={setOpen}
        formProps={{
          form,
          onFinish: (values) => mutation.mutate(values),
        }}
      >
        <LabelBase label='Nombre:' orientation='column'>
          <InputBase
            prefix={<MdDriveFileRenameOutline className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'nombre',
              rules: [
                { required: true, message: 'Por favor, ingresa el nombre' },
                { min: 2, message: 'El nombre debe tener al menos 2 caracteres' },
                { max: 100, message: 'El nombre no puede tener más de 100 caracteres' },
              ],
            }}
            placeholder='Nombre de la profesión'
          />
        </LabelBase>
      </ModalForm>
      <Tooltip title='Crear Profesión'>
        <ButtonCreateFormWithName onClick={() => setOpen(true)} className={className} />
      </Tooltip>
    </>
  )
}
