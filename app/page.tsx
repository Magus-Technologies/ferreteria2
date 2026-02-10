'use client'

import { Form, Input, message } from 'antd'
import FormBase from '../components/form/form-base'
import Image from 'next/image'
import { FaAngleRight, FaSpinner, FaUserTie } from 'react-icons/fa'
import { RiLockPasswordFill } from 'react-icons/ri'
import { RainbowButton } from '~/components/magicui/rainbow-button'
import { useAuth } from '~/lib/auth-context'
import { useState, useEffect } from 'react'
import ModalRecuperarPassword from './_components/modals/modal-recuperar-password'
import { useRouter } from 'next/navigation'

export interface LoginValues {
  email: string
  password: string
}

export default function Home() {
  const router = useRouter()
  const [form] = Form.useForm()
  const { login, user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [modalRecuperarOpen, setModalRecuperarOpen] = useState(false)

  // Redirigir si ya está autenticado (useEffect para evitar setState durante render)
  useEffect(() => {
    if (user && !authLoading) {
      router.push('/ui')
    }
  }, [user, authLoading, router])

  const handleLogin = async (values: LoginValues) => {
    setLoading(true)
    try {
      const result = await login(values.email, values.password)

      if (result.success) {
        message.success('Inicio de sesión exitoso')
        
        // Pequeño delay para asegurar que el token se guardó
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Usar router.push en lugar de window.location.href para navegación SPA
        router.push('/ui')
      } else {
        message.error(result.error || 'Error al iniciar sesión')
        
        if (result.error?.includes('credenciales')) {
          form.setFields([
            {
              name: 'email',
              errors: [result.error],
            },
            {
              name: 'password',
              errors: [''],
            },
          ])
        }
      }
    } catch (error) {
      message.error('Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  // Si está cargando o ya autenticado, mostrar nada (la redirección se maneja en useEffect)
  if (authLoading || user) return null

  return (
    <div className="bg-[url('/fondo-login.jpg')] bg-cover bg-center bg-no-repeat h-dvh w-dvw flex items-center justify-center animate-fade animate-ease-in-out relative overflow-hidden">
      <div className='absolute inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-[2px]'></div>

      {/* Contenedor del formulario - Responsivo */}
      <div className='bg-white/95 backdrop-blur-sm
                      px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-8 lg:py-14
                      rounded-xl sm:rounded-2xl
                      animate-fade-down animate-delay-500 animate-ease-in-out
                      shadow-2xl shadow-black/20
                      w-[calc(100dvw-2rem)] sm:w-[min(90dvw,28rem)] md:w-[min(85dvw,32rem)] lg:w-auto lg:max-w-md xl:max-w-lg
                      max-h-dvh overflow-y-auto
                      mx-4 sm:mx-0
                      relative z-10'>

        {/* Logo - Responsivo */}
        <div className='mb-6 sm:mb-8 md:mb-10 lg:mb-12 flex justify-center'>
          <Image
            className='w-48 h-auto sm:w-56 md:w-64 lg:w-80 xl:w-[350px] object-contain'
            src='/logo-horizontal.png'
            alt='Logo'
            width={350}
            height={300}
            priority
          />
        </div>

        {/* Formulario */}
        <FormBase<LoginValues>
          form={form}
          name='login'
          size='large'
          onFinish={handleLogin}
          autoComplete='off'
        >
          {/* Campos falsos ocultos para engañar al autocompletado del navegador */}
          <input
            type='text'
            name='fake-username'
            autoComplete='username'
            style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}
            tabIndex={-1}
            aria-hidden='true'
            readOnly
          />
          <input
            type='password'
            name='fake-password'
            autoComplete='current-password'
            style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}
            tabIndex={-1}
            aria-hidden='true'
            readOnly
          />

          <Form.Item
            hasFeedback
            name='email'
            rules={[
              {
                required: true,
                message: 'Por favor, ingresa tu nombre de usuario',
              },
            ]}
          >
            <Input
              prefix={<FaUserTie className='text-cyan-500 mx-2 text-base sm:text-lg' />}
              placeholder='Nombre de Usuario'
              className='text-sm sm:text-base'
              autoComplete='off'
              name='username-real'
            />
          </Form.Item>
          <Form.Item
            hasFeedback
            name='password'
            rules={[
              { required: true, message: 'Por favor, ingresa tu contraseña' },
            ]}
          >
            <Input
              type='password'
              prefix={<RiLockPasswordFill className='text-cyan-500 mx-2 text-base sm:text-lg' />}
              placeholder='Contraseña'
              className='text-sm sm:text-base'
              autoComplete='new-password'
              name='password-real'
            />
          </Form.Item>
          <RainbowButton
            type='submit'
            className='w-full mt-2 active:scale-95 transition-all hover:scale-105
                       text-base sm:text-lg
                       h-10 sm:h-11 md:h-12'
            size='lg'
            variant='outline'
            disabled={loading}
          >
            Iniciar sesión
            {loading && <FaSpinner className='ml-2 animate-spin' />}
          </RainbowButton>
        </FormBase>

        {/* Recuperar contraseña */}
        <div
          onClick={() => setModalRecuperarOpen(true)}
          className='active:scale-95 mt-3 sm:mt-4 text-center
                        text-[11px] sm:text-xs
                        text-gray-500 cursor-pointer hover:text-sky-500
                        transition-all group/recuperar-password
                        flex items-center w-full justify-center -ml-2'
        >
          <FaAngleRight className='invisible -translate-x-2 transition-all
                                   group-hover/recuperar-password:translate-x-0
                                   group-hover/recuperar-password:visible
                                   text-xs sm:text-sm' />
          ¿Olvidaste tu contraseña?
        </div>
      </div>

      {/* Modal Recuperar Contraseña */}
      <ModalRecuperarPassword
        open={modalRecuperarOpen}
        onClose={() => setModalRecuperarOpen(false)}
      />
    </div>
  )
}