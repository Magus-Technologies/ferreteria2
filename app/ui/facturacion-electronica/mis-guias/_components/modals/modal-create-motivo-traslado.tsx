'use client'

import { App, Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import { useEffect, useState } from 'react'
import { motivoTrasladoApi, type MotivoTraslado } from '~/lib/api/motivo-traslado'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import FormCreateMotivoTraslado from '../form/form-create-motivo-traslado'

interface ModalCreateMotivoTrasladoProps {
  open: boolean
  setOpen: (open: boolean) => void
  dataEdit?: MotivoTraslado
  textDefault?: string
  setTextDefault?: (text: string) => void
  onSuccess?: (data: MotivoTraslado) => void
}

export interface FormCreateMotivoTrasladoValues {
  codigo: string
  descripcion: string
  activo: number // Cambiado a number para usar SelectEstado (0 o 1)
}

export default function ModalCreateMotivoTraslado({
  open,
  setOpen,
  dataEdit,
  textDefault,
  setTextDefault,
  onSuccess,
}: ModalCreateMotivoTrasladoProps) {
  const [form] = Form.useForm<FormCreateMotivoTrasladoValues>()
  const queryClient = useQueryClient()
  const { notification } = App.useApp()

  const [loading, setLoading] = useState(false)

  const mutationCreate = useMutation({
    mutationFn: async (values: FormCreateMotivoTrasladoValues) => {
      // Convertir activo de number (0 o 1) a boolean
      const data = {
        ...values,
        activo: values.activo === 1,
      }
      const result = await motivoTrasladoApi.create(data)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: data => {
      notification.success({
        message: 'Motivo de traslado creado',
        description: 'Motivo de traslado creado correctamente',
      })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.MOTIVOS_TRASLADO] })
      
      // IMPORTANTE: Retrasar el cierre del modal para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        setOpen(false)
        form.resetFields()
        if (data?.data) {
          onSuccess?.(data.data)
          setTextDefault?.(data.data.codigo)
        }
      }, 800)
    },
    onError: (error: Error) => {
      notification.error({
        message: 'Error',
        description: error.message || 'Error al crear motivo de traslado',
      })
    },
    onSettled: () => {
      setLoading(false)
    },
  })

  const mutationUpdate = useMutation({
    mutationFn: async (values: FormCreateMotivoTrasladoValues) => {
      if (!dataEdit?.id) throw new Error('ID no encontrado')
      // Convertir activo de number (0 o 1) a boolean
      const data = {
        ...values,
        activo: values.activo === 1,
      }
      const result = await motivoTrasladoApi.update(dataEdit.id, data)
      if (result.error) {
        throw new Error(result.error.message)
      }
      return result.data
    },
    onSuccess: () => {
      notification.success({
        message: 'Motivo de traslado actualizado',
        description: 'Motivo de traslado actualizado correctamente',
      })
      queryClient.invalidateQueries({ queryKey: [QueryKeys.MOTIVOS_TRASLADO] })
      
      setTimeout(() => {
        setOpen(false)
        form.resetFields()
      }, 800)
    },
    onError: (error: Error) => {
      notification.error({
        message: 'Error',
        description: error.message || 'Error al actualizar motivo de traslado',
      })
    },
    onSettled: () => {
      setLoading(false)
    },
  })

  const handleSubmit = async (values: FormCreateMotivoTrasladoValues) => {
    setLoading(true)
    
    if (dataEdit) {
      mutationUpdate.mutate(values)
    } else {
      mutationCreate.mutate(values)
    }
  }

  useEffect(() => {
    form.resetFields()
    if (dataEdit) {
      form.setFieldsValue({
        codigo: dataEdit.codigo,
        descripcion: dataEdit.descripcion,
        activo: dataEdit.activo ? 1 : 0, // Convertir boolean a number
      })
    } else {
      form.setFieldsValue({
        codigo: textDefault,
        activo: 1, // Activo por defecto
      })
    }
  }, [form, dataEdit, open, textDefault])

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            {dataEdit ? 'Editar' : 'Crear'} Motivo de Traslado
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
        onFinish: handleSubmit,
      }}
    >
      <FormCreateMotivoTraslado form={form} dataEdit={dataEdit} />
    </ModalForm>
  )
}
