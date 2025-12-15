'use client'

import { Form, Input } from 'antd'
import FormBase from '../components/form/form-base'
import Image from 'next/image'
import { FaAngleRight, FaSpinner, FaUserTie } from 'react-icons/fa'
import { RiLockPasswordFill } from 'react-icons/ri'
import { RainbowButton } from '~/components/magicui/rainbow-button'
import { useServerMutation } from '~/hooks/use-server-mutation'
import loginServer from './_actions/login'
import { useSession } from 'next-auth/react'

export interface LoginValues {
  username: string
  password: string
}

export default function Home() {
  const [form] = Form.useForm()

  const { execute: login, loading } = useServerMutation({
    action: loginServer,
    onSuccess: () => (window.location.href = '/ui'),
  })

  const { status } = useSession()
  if (status === 'loading') return null
  if (status === 'authenticated') return (window.location.href = '/ui')

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
          onFinish={login}
        >
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
            />
          </Form.Item>
          <Form.Item
            hasFeedback
            name='password'
            rules={[
              { required: true, message: 'Por favor, ingresa tu contraseña' },
            ]}
          >
            <Input.Password
              prefix={<RiLockPasswordFill className='text-cyan-500 mx-2 text-base sm:text-lg' />}
              placeholder='Contraseña'
              className='text-sm sm:text-base'
            />
          </Form.Item>
          <RainbowButton
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
        <div className='active:scale-95 mt-3 sm:mt-4 text-center
                        text-[11px] sm:text-xs
                        text-gray-500 cursor-pointer hover:text-sky-500
                        transition-all group/recuperar-password
                        flex items-center w-full justify-center -ml-2'>
          <FaAngleRight className='invisible -translate-x-2 transition-all
                                   group-hover/recuperar-password:translate-x-0
                                   group-hover/recuperar-password:visible
                                   text-xs sm:text-sm' />
          ¿Olvidaste tu contraseña?
        </div>
      </div>
    </div>
  )
}
