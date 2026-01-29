'use client'

import { Form, message } from 'antd'
import { useEffect } from 'react'
import { Chofer, choferApi } from '~/lib/api/chofer'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import FormCreateChofer from '../form/form-create-chofer'

interface ModalCreateChoferProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: (chofer: Chofer) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
  dataEdit?: Chofer
}

export default function ModalCreateChofer({
  open,
  setOpen,
  onSuccess,
  textDefault,
  setTextDefault,
  dataEdit,
}: ModalCreateChoferProps) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { mutate: guardarChofer, isPending: loading } = useMutation({
    mutationFn: async (values: any) => {
      const data = {
        dni: values.dni,
        nombres: values.nombres,
        apellidos: values.apellidos,
        licencia: values.licencia,
        telefono: values.telefono || null,
        email: values.email || null,
        direccion: values.direccion || null,
        estado: 1,
      }

      if (dataEdit) {
        const response = await choferApi.update(dataEdit.id, data)
        return response.data
      } else {
        const response = await choferApi.create(data)
        return response.data
      }
    },
    onSuccess: data => {
      message.success(
        dataEdit
          ? 'Chofer actualizado exitosamente'
          : 'Chofer creado exitosamente'
      )
      queryClient.invalidateQueries({ queryKey: [QueryKeys.CHOFERES] })
      
      setTimeout(() => {
        setOpen(false)
        form.resetFields()
        if (data?.data) {
          onSuccess?.(data.data)
        }
      }, 800)
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          `Error al ${dataEdit ? 'actualizar' : 'crear'} el chofer`
      )
    },
  })

  useEffect(() => {
    form.resetFields()
    if (dataEdit) {
      const formValues = Object.fromEntries(
        Object.entries(dataEdit).map(([key, value]) => [key, value ?? undefined])
      )
      form.setFieldsValue(formValues)
    } else {
      form.setFieldsValue({
        dni: textDefault,
      })
    }
  }, [form, dataEdit, open, textDefault])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {dataEdit ? 'Editar' : 'Crear'} Chofer
          </TitleForm>
        ),
        className: 'min-w-[550px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: dataEdit ? 'Editar' : 'Crear',
      }}
      onCancel={() => {
        form.resetFields()
        setTextDefault?.('')
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: (values) => guardarChofer(values),
      }}
    >
      <FormCreateChofer form={form} dataEdit={dataEdit} />
    </ModalForm>
  )
}
