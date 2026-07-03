'use client'

import { Form, message } from 'antd'
import { useEffect } from 'react'
import { Transportista, transportistaApi } from '~/lib/api/transportista'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import FormCreateTransportista from '../form/form-create-transportista'

interface ModalCreateTransportistaProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: (transportista: Transportista) => void
  textDefault?: string
  setTextDefault?: (text: string) => void
  dataEdit?: Transportista
}

export default function ModalCreateTransportista({
  open,
  setOpen,
  onSuccess,
  textDefault,
  setTextDefault,
  dataEdit,
}: ModalCreateTransportistaProps) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { mutate: guardarTransportista, isPending: loading } = useMutation({
    mutationFn: async (values: any) => {
      const data = {
        ruc: values.ruc,
        razon_social: values.razon_social,
        nro_mtc: values.nro_mtc || undefined,
      }

      if (dataEdit) {
        const response = await transportistaApi.update(dataEdit.id, data)
        return response.data?.data
      } else {
        const response = await transportistaApi.create(data)
        return response.data
      }
    },
    onSuccess: data => {
      message.success(
        dataEdit
          ? 'Transportista actualizado exitosamente'
          : 'Transportista creado exitosamente'
      )
      queryClient.invalidateQueries({ queryKey: [QueryKeys.TRANSPORTISTAS] })

      setTimeout(() => {
        setOpen(false)
        form.resetFields()
        if (data) {
          onSuccess?.(data)
        }
      }, 800)
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message ||
          `Error al ${dataEdit ? 'actualizar' : 'crear'} el transportista`
      )
    },
  })

  useEffect(() => {
    form.resetFields()
    if (dataEdit) {
      form.setFieldsValue({
        ruc: dataEdit.ruc,
        razon_social: dataEdit.razon_social,
        nro_mtc: dataEdit.nro_mtc ?? undefined,
      })
    } else {
      form.setFieldsValue({
        ruc: textDefault,
      })
    }
  }, [form, dataEdit, open, textDefault])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {dataEdit ? 'Editar' : 'Crear'} Transportista
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
        onFinish: values => guardarTransportista(values),
      }}
    >
      <FormCreateTransportista form={form} dataEdit={dataEdit} />
    </ModalForm>
  )
}
