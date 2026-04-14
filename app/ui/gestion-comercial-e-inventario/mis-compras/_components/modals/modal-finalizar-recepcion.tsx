'use client'

import { Modal, Form, Input } from 'antd'
import { useState } from 'react'
import FormBase from '~/components/form/form-base'
import LabelBase from '~/components/form/label-base'
import { FaExclamationTriangle } from 'react-icons/fa'

interface ModalFinalizarRecepcionProps {
  open: boolean
  onCancel: () => void
  onConfirm: (motivo: string) => void
  loading?: boolean
  productosPendientes?: Array<{
    producto: string
    unidad: string
    cantidad_pendiente: number
  }>
}

interface FormValues {
  motivo_finalizacion: string
}

export default function ModalFinalizarRecepcion({
  open,
  onCancel,
  onConfirm,
  loading = false,
  productosPendientes = [],
}: ModalFinalizarRecepcionProps) {
  const [form] = Form.useForm<FormValues>()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      onConfirm(values.motivo_finalizacion)
      form.resetFields()
    } catch (error) {
      // Validation failed
    }
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={
        <div className='flex items-center gap-2 text-orange-600'>
          <FaExclamationTriangle size={20} />
          <span>Finalizar Recepción</span>
        </div>
      }
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText='Finalizar'
      cancelText='Cancelar'
      width={600}
      okButtonProps={{ danger: true }}
    >
      <FormBase form={form} layout='vertical'>
        <div className='mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded'>
          <p className='text-sm text-yellow-800 font-medium mb-2'>
            ⚠️ Esta acción creará automáticamente una recepción con estado INACTIVO para los productos faltantes.
          </p>
          <p className='text-xs text-yellow-700'>
            Los productos NO RECIBIDOS quedarán registrados pero no se agregarán al inventario.
          </p>
        </div>

        {productosPendientes.length > 0 && (
          <div className='mb-4'>
            <p className='text-sm font-medium text-gray-700 mb-2'>
              Productos que se finalizarán ({productosPendientes.length}):
            </p>
            <div className='max-h-40 overflow-y-auto border border-gray-200 rounded p-2 bg-gray-50'>
              {productosPendientes.map((item, index) => (
                <div
                  key={index}
                  className='text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0'
                >
                  <span className='font-medium'>{item.producto}</span>
                  {' - '}
                  <span className='text-red-600 font-semibold'>
                    {item.cantidad_pendiente} {item.unidad}
                  </span>
                  {' pendiente(s)'}
                </div>
              ))}
            </div>
          </div>
        )}

        <LabelBase label='Motivo de Finalización:' required>
          <Form.Item
            name='motivo_finalizacion'
            rules={[
              {
                required: true,
                message: 'El motivo es requerido',
              },
              {
                min: 10,
                message: 'El motivo debe tener al menos 10 caracteres',
              },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder='Ejemplo: El proveedor no enviará los productos faltantes, se acordó cancelar el resto del pedido...'
              maxLength={500}
              showCount
            />
          </Form.Item>
        </LabelBase>
      </FormBase>
    </Modal>
  )
}
