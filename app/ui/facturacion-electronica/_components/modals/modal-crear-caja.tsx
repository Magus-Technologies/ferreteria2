'use client'

import { Form } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectUsuarioResponsable from '~/app/_components/form/selects/select-usuario-responsable'
import LabelBase from '~/components/form/label-base'
import useCrearCajaPrincipal from '../../_hooks/cajas/use-crear-caja-principal'

interface ModalCrearCajaProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

export interface CrearCajaFormValues {
  user_id: string
  nombre: string
}

export default function ModalCrearCaja({ open, setOpen, onSuccess }: ModalCrearCajaProps) {
  const [form] = Form.useForm<CrearCajaFormValues>()

  const { crearCaja, loading } = useCrearCajaPrincipal({
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
      onSuccess?.()
    },
  })

  return (
    <ModalForm
      modalProps={{
        width: 600,
        title: <TitleForm>Crear Caja Principal</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Crear Caja',
      }}
      onCancel={() => {
        form.resetFields()
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: crearCaja,
        layout: 'vertical',
      }}
    >
      <LabelBase label='Responsable de la Caja' orientation='column'>
        <SelectUsuarioResponsable
          sinCaja={false}
          propsForm={{
            name: 'user_id',
            rules: [{ required: true, message: 'Selecciona un responsable' }],
          }}
        />
      </LabelBase>

      <LabelBase label='Nombre de la Caja' className='mt-4' orientation='column'>
        <InputBase
          placeholder='Ej: Caja Principal - Juan Pérez'
          uppercase={false}
          propsForm={{
            name: 'nombre',
            rules: [
              { required: true, message: 'Ingresa el nombre de la caja' },
              { max: 255, message: 'Máximo 255 caracteres' },
            ],
          }}
        />
      </LabelBase>

      <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
        <p className='text-sm text-slate-600'>
          <strong>Nota:</strong> Al crear la caja principal, se generará automáticamente una <strong>Caja Chica</strong> para efectivo.
        </p>
      </div>
    </ModalForm>
  )
}
