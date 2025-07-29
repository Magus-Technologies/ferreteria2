'use client'

import { Form, Input } from 'antd'
import FormBase from '../components/form/form-base'
import Image from 'next/image'
import { FaAngleRight, FaSpinner, FaUserTie } from 'react-icons/fa'
import { RiLockPasswordFill } from 'react-icons/ri'
import { RainbowButton } from '~/components/magicui/rainbow-button'
import { useServerMutation } from '~/hooks/use-server-mutation'
import loginServer from './_actions/login'
import { redirect } from 'next/navigation'
import { useSession } from 'next-auth/react'

export interface LoginValues {
  username: string
  password: string
}

export default function Home() {
  const [form] = Form.useForm()

  const { execute: login, loading } = useServerMutation({
    action: loginServer,
    onSuccess: () => redirect('/ui'),
  })

  const { data: session } = useSession()
  console.log('🚀 ~ file: page.tsx:28 ~ session:', session)
  if (session) redirect('/ui')

  return (
    <div className="bg-[url('/fondo-login.jpg')] h-dvh w-dvw flex items-center justify-center animate-fade animate-ease-in-out relative">
      <div className='absolute inset-0 bg-black/20'></div>
      <div className='bg-white px-8 py-14 rounded-2xl animate-fade-down animate-delay-500 animate-ease-in-out shadow-xl max-w-3/4'>
        <Image
          className='mb-12'
          src='/logo-horizontal.png'
          alt='Logo'
          width={350}
          height={300}
        />
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
              prefix={<FaUserTie className='text-cyan-500 mx-2' />}
              placeholder='Nombre de Usuario'
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
              prefix={<RiLockPasswordFill className='text-cyan-500 mx-2' />}
              placeholder='Contraseña'
            />
          </Form.Item>
          <RainbowButton
            className='w-full mt-2 active:scale-95 transition-all hover:scale-105 text-lg'
            size='lg'
            variant='outline'
            disabled={loading}
          >
            Iniciar sesión
            {loading && <FaSpinner className='ml-2 animate-spin' />}
          </RainbowButton>
        </FormBase>
        <div className='active:scale-95 mt-4 text-center text-xs text-gray-500 cursor-pointer hover:text-sky-500 transition-all group/recuperar-password flex items-center w-full justify-center -ml-2'>
          <FaAngleRight className='invisible -translate-x-2 transition-all group-hover/recuperar-password:translate-x-0 group-hover/recuperar-password:visible' />
          ¿Olvidaste tu contraseña?
        </div>
      </div>
    </div>
  )
}
