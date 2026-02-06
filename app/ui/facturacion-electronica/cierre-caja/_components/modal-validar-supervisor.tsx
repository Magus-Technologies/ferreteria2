'use client'

import { Modal, Input, Form } from 'antd'
import { useState } from 'react'

interface ModalValidarSupervisorProps {
  open: boolean
  supervisorNombre: string
  onConfirm: (password: string) => void
  onCancel: () => void
}

export default function ModalValidarSupervisor({
  open,
  supervisorNombre,
  onConfirm,
  onCancel,
}: ModalValidarSupervisorProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      onConfirm(values.supervisor_password)
      form.resetFields()
    } catch (error) {
      console.error('Validation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={
        <div className='text-lg font-semibold text-slate-800'>
          Validación de Supervisor
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText='Validar'
      cancelText='Cancelar'
      width={500}
      destroyOnClose
    >
      <div className='py-4'>
        <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded'>
          <p className='text-sm text-slate-700'>
            Has seleccionado a <strong className='text-blue-700'>{supervisorNombre}</strong> como supervisor.
          </p>
          <p className='text-sm text-slate-600 mt-1'>
            Por favor, ingresa la contraseña de supervisor para validar el cierre de caja.
          </p>
        </div>

        <Form form={form} layout='vertical'>
          <Form.Item
            name='supervisor_password'
            label='Contraseña de Supervisor'
            rules={[
              { required: true, message: 'La contraseña de supervisor es obligatoria' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
            ]}
          >
            <Input.Password
              placeholder='Ingrese la contraseña de supervisor'
              size='large'
              autoFocus
            />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}
