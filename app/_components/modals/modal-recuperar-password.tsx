'use client'

import { useState } from 'react'
import { Modal, Form, Input, message, Button } from 'antd'
import { FaEnvelope, FaKey, FaLock, FaSpinner } from 'react-icons/fa'
import {
  sendPasswordResetCode,
  verifyPasswordResetCode,
  resetPassword,
} from '~/app/_actions/password-reset'

interface ModalRecuperarPasswordProps {
  open: boolean
  onClose: () => void
}

type Step = 'email' | 'code' | 'password'

export default function ModalRecuperarPassword({
  open,
  onClose,
}: ModalRecuperarPasswordProps) {
  const [form] = Form.useForm()
  const [step, setStep] = useState<Step>('email')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')

  const handleClose = () => {
    form.resetFields()
    setStep('email')
    setEmail('')
    setCode('')
    onClose()
  }

  const handleSendCode = async (values: { email: string }) => {
    setLoading(true)
    try {
      const result = await sendPasswordResetCode(values.email)

      if (result.success) {
        message.success(
          'Hemos enviado un código de verificación a tu correo electrónico'
        )
        setEmail(values.email)
        setStep('code')
      } else {
        message.error(result.error || 'Error al enviar el código')
      }
    } catch (error) {
      message.error('Error al enviar el código')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (values: { code: string }) => {
    setLoading(true)
    try {
      const result = await verifyPasswordResetCode(email, values.code)

      if (result.success) {
        message.success('Código verificado correctamente')
        setCode(values.code)
        setStep('password')
      } else {
        message.error(result.error || 'Código inválido o expirado')
      }
    } catch (error) {
      message.error('Error al verificar el código')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (values: {
    password: string
    password_confirmation: string
  }) => {
    setLoading(true)
    try {
      const result = await resetPassword(
        email,
        code,
        values.password,
        values.password_confirmation
      )

      if (result.success) {
        message.success('Contraseña cambiada exitosamente')
        handleClose()
      } else {
        message.error(result.error || 'Error al cambiar la contraseña')
      }
    } catch (error) {
      message.error('Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const getTitle = () => {
    switch (step) {
      case 'email':
        return 'Recuperar Contraseña'
      case 'code':
        return 'Verificar Código'
      case 'password':
        return 'Nueva Contraseña'
    }
  }

  const getDescription = () => {
    switch (step) {
      case 'email':
        return 'Introduce tu correo electrónico para recibir un código de verificación'
      case 'code':
        return 'Introduce el código de 6 dígitos que enviamos a tu correo'
      case 'password':
        return 'Introduce tu nueva contraseña'
    }
  }

  return (
    <Modal
      title={
        <div className='text-center'>
          <h3 className='text-xl font-semibold text-gray-800'>{getTitle()}</h3>
          <p className='text-sm text-gray-500 mt-1'>{getDescription()}</p>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={450}
    >
      {step === 'email' && (
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSendCode}
          className='mt-4'
        >
          <Form.Item
            name='email'
            rules={[
              { required: true, message: 'Por favor, ingresa tu correo' },
              { type: 'email', message: 'Correo electrónico inválido' },
            ]}
          >
            <Input
              prefix={<FaEnvelope className='text-cyan-500' />}
              placeholder='Correo electrónico'
              size='large'
            />
          </Form.Item>
          <Form.Item className='mb-0'>
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              block
              size='large'
              className='bg-cyan-500 hover:bg-cyan-600'
            >
              {loading ? (
                <>
                  <FaSpinner className='animate-spin mr-2' />
                  Enviando...
                </>
              ) : (
                'Enviar Código'
              )}
            </Button>
          </Form.Item>
        </Form>
      )}

      {step === 'code' && (
        <Form
          form={form}
          layout='vertical'
          onFinish={handleVerifyCode}
          className='mt-4'
        >
          <Form.Item
            name='code'
            rules={[
              { required: true, message: 'Por favor, ingresa el código' },
              { len: 6, message: 'El código debe tener 6 dígitos' },
              {
                pattern: /^[0-9]+$/,
                message: 'El código solo debe contener números',
              },
            ]}
          >
            <Input
              prefix={<FaKey className='text-cyan-500' />}
              placeholder='Código de 6 dígitos'
              size='large'
              maxLength={6}
            />
          </Form.Item>
          <div className='flex gap-2'>
            <Button
              onClick={() => {
                form.resetFields()
                setStep('email')
              }}
              block
              size='large'
            >
              Volver
            </Button>
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              block
              size='large'
              className='bg-cyan-500 hover:bg-cyan-600'
            >
              {loading ? (
                <>
                  <FaSpinner className='animate-spin mr-2' />
                  Verificando...
                </>
              ) : (
                'Verificar'
              )}
            </Button>
          </div>
        </Form>
      )}

      {step === 'password' && (
        <Form
          form={form}
          layout='vertical'
          onFinish={handleResetPassword}
          className='mt-4'
        >
          <Form.Item
            name='password'
            rules={[
              { required: true, message: 'Por favor, ingresa tu contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' },
            ]}
          >
            <Input.Password
              prefix={<FaLock className='text-cyan-500' />}
              placeholder='Nueva contraseña'
              size='large'
            />
          </Form.Item>
          <Form.Item
            name='password_confirmation'
            dependencies={['password']}
            rules={[
              { required: true, message: 'Por favor, confirma tu contraseña' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(
                    new Error('Las contraseñas no coinciden')
                  )
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<FaLock className='text-cyan-500' />}
              placeholder='Confirmar contraseña'
              size='large'
            />
          </Form.Item>
          <Form.Item className='mb-0'>
            <Button
              type='primary'
              htmlType='submit'
              loading={loading}
              block
              size='large'
              className='bg-cyan-500 hover:bg-cyan-600'
            >
              {loading ? (
                <>
                  <FaSpinner className='animate-spin mr-2' />
                  Cambiando...
                </>
              ) : (
                'Cambiar Contraseña'
              )}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
