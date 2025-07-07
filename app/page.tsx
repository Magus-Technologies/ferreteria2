'use client'

import { Form, Input } from 'antd'
import FormBase from '../components/form/form-base'
import Image from 'next/image'
import { FaAngleRight, FaUserTie } from 'react-icons/fa'
import { RiLockPasswordFill } from 'react-icons/ri'
import { RainbowButton } from '~/components/magicui/rainbow-button'

export default function Home() {
  const [form] = Form.useForm()

  return (
    <div className="bg-[url('/fondo-login.jpg')] h-dvh w-dvw flex items-center justify-center animate-fade animate-ease-in-out relative">
      <div className='absolute inset-0 bg-black/20'></div>
      <div className='bg-white px-8 py-14 rounded-2xl animate-fade-down animate-delay-500 animate-ease-in-out shadow-xl'>
        <Image
          className='mb-12'
          src='/logo-horizontal.png'
          alt='Logo'
          width={350}
          height={300}
        />
        <FormBase form={form} name='login' size='large'>
          <Form.Item
            hasFeedback
            name='username'
            rules={[
              {
                required: true,
                message: 'Por favor, ingresa tu nombre de usuario',
              },
            ]}
          >
            <Input
              prefix={<FaUserTie className='text-sky-500 mx-2' />}
              placeholder='Nombre de usuario'
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
              prefix={<RiLockPasswordFill className='text-sky-500 mx-2' />}
              placeholder='Contraseña'
            />
          </Form.Item>
          <RainbowButton
            className='w-full mt-2 active:scale-95 transition-all hover:scale-105 text-lg'
            size='lg'
            // disabled={!submittable}
            variant='outline'
          >
            Iniciar sesión
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
