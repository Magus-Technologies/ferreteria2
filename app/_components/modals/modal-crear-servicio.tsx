'use client'

import { Form, message } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { servicioApi, type Servicio } from '~/lib/api/servicios'
import ModalForm from '~/components/modals/modal-form'
import TitleForm from '~/components/form/title-form'
import LabelBase from '~/components/form/label-base'
import InputBase from '~/app/_components/form/inputs/input-base'
import InputNumberBase from '~/app/_components/form/inputs/input-number-base'
import { FaConciergeBell } from 'react-icons/fa'
import { MdAttachMoney, MdCode } from 'react-icons/md'

interface ModalCrearServicioProps {
  open: boolean
  setOpen: (open: boolean) => void
  onCreated?: (servicio: Servicio) => void
}

export default function ModalCrearServicio({
  open,
  setOpen,
  onCreated,
}: ModalCrearServicioProps) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { mutate: guardarServicio, isPending: loading } = useMutation({
    mutationFn: async (values: any) => {
      const response = await servicioApi.create({
        nombre: values.nombre,
        precio: values.precio,
        codigo_sunat: values.codigo_sunat || null,
      })
      if (response.error) throw new Error(response.error.message)
      return response.data
    },
    onSuccess: (data) => {
      message.success('Servicio creado exitosamente')
      queryClient.invalidateQueries({ queryKey: [QueryKeys.SERVICIOS] })
      setTimeout(() => {
        setOpen(false)
        form.resetFields()
        if (data?.data) {
          onCreated?.(data.data)
        }
      }, 500)
    },
    onError: (error: Error) => {
      message.error(error.message || 'Error al crear el servicio')
    },
  })

  return (
    <ModalForm
      modalProps={{
        title: (
          <TitleForm className='!pb-0'>
            Crear Servicio
          </TitleForm>
        ),
        className: 'min-w-[450px]',
        wrapClassName: '!flex !items-center',
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Crear',
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: (values: any) => guardarServicio(values),
      }}
    >
      <div className='flex items-center justify-center mt-5'>
        <LabelBase
          label='Nombre:'
          className='w-full'
          classNames={{ labelParent: 'mb-6' }}
        >
          <InputBase
            prefix={<FaConciergeBell className='text-rose-700 mx-1' />}
            propsForm={{
              name: 'nombre',
              rules: [
                { required: true, message: 'Ingresa el nombre del servicio' },
                { max: 250, message: 'Máximo 250 caracteres' },
              ],
            }}
            placeholder='Ej: DELIVERY, FLETE, INSTALACIÓN...'
            uppercase
          />
        </LabelBase>
      </div>

      <LabelBase
        label='Precio:'
        classNames={{ labelParent: 'mb-6' }}
      >
        <InputNumberBase
          prefix={<MdAttachMoney className='text-rose-700 mx-1' />}
          propsForm={{
            name: 'precio',
            rules: [
              { required: true, message: 'Ingresa el precio' },
            ],
          }}
          min={0}
          precision={4}
          placeholder='0.00'
        />
      </LabelBase>

      <LabelBase
        label='Cód. SUNAT:'
        classNames={{ labelParent: 'mb-6' }}
      >
        <InputBase
          prefix={<MdCode className='text-cyan-600 mx-1' />}
          propsForm={{
            name: 'codigo_sunat',
            rules: [
              { max: 50, message: 'Máximo 50 caracteres' },
            ],
          }}
          placeholder='Código de servicio SUNAT (opcional)'
        />
      </LabelBase>
    </ModalForm>
  )
}
