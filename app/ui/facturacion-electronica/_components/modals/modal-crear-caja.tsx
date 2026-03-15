'use client'

import { Form, Switch } from 'antd'
import TitleForm from '~/components/form/title-form'
import ModalForm from '~/components/modals/modal-form'
import InputBase from '~/app/_components/form/inputs/input-base'
import SelectUsuarioResponsable from '~/app/_components/form/selects/select-usuario-responsable'
import LabelBase from '~/components/form/label-base'
import useCrearCajaPrincipal from '../../_hooks/cajas/use-crear-caja-principal'
import { useState } from 'react'

interface ModalCrearCajaProps {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
}

export interface CrearCajaFormValues {
  user_id: string
  nombre: string
  crear_metodo_pago?: boolean
  nombre_metodo_pago?: string
}

export default function ModalCrearCaja({ open, setOpen, onSuccess }: ModalCrearCajaProps) {
  const [form] = Form.useForm<CrearCajaFormValues>()
  const [crearMetodoPago, setCrearMetodoPago] = useState(false)

  const { crearCaja, loading } = useCrearCajaPrincipal({
    onSuccess: () => {
      setOpen(false)
      form.resetFields()
      setCrearMetodoPago(false)
      onSuccess?.()
    },
  })

  return (
    <ModalForm
      modalProps={{
        width: 700,
        title: <TitleForm>Crear Caja Principal</TitleForm>,
        centered: true,
        okButtonProps: { loading, disabled: loading },
        okText: 'Crear Caja',
      }}
      onCancel={() => {
        form.resetFields()
        setCrearMetodoPago(false)
      }}
      open={open}
      setOpen={setOpen}
      formProps={{
        form,
        onFinish: (values) => crearCaja({ ...values, crear_metodo_pago: crearMetodoPago }),
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

      <div className='mt-6 p-3 bg-amber-50 rounded-lg border border-amber-200'>
        <LabelBase label='¿Crear Método de Pago Efectivo?' orientation='column'>
          <Switch
            checked={crearMetodoPago}
            onChange={setCrearMetodoPago}
            checkedChildren='Sí'
            unCheckedChildren='No'
          />
          <p className='text-xs text-slate-500 mt-2'>
            Crea automáticamente un método de pago para efectivo vinculado a esta caja
          </p>
        </LabelBase>

        {crearMetodoPago && (
          <div className='mt-4'>
            <LabelBase label='Nombre del Método de Pago' orientation='column'>
              <InputBase
                placeholder='Ej: Efectivo, Caja Chica'
                uppercase={false}
                propsForm={{
                  name: 'nombre_metodo_pago',
                  rules: [
                    { required: true, message: 'Ingresa el nombre del método de pago' },
                    { max: 191, message: 'Máximo 191 caracteres' },
                  ],
                }}
              />
              <p className='text-xs text-slate-500 mt-1'>
                Este será el nombre del método de pago para efectivo
              </p>
            </LabelBase>
          </div>
        )}
      </div>

      <div className='mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200'>
        <p className='text-sm text-slate-600'>
          <strong>Nota:</strong> Al crear la caja principal, se generará automáticamente una <strong>Caja Chica</strong> para efectivo.
        </p>
      </div>
    </ModalForm>
  )
}
