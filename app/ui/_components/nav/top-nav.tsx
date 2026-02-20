'use client'

import { MenuProps } from 'antd/lib'
import { FaSignOutAlt, FaUserSlash } from 'react-icons/fa'
import { useRouter } from 'next/navigation'
import DropdownBase from '~/components/dropdown/dropdown-base'
import { useAuth } from '~/lib/auth-context'
import { useModalProveedoresDesactivados } from '~/app/_stores/store-modal-proveedores-desactivados'
import ModalProveedoresDesactivados from '~/app/_components/modals/modal-proveedores-desactivados'

export default function TopNavUI({ className }: { className?: string }) {
  const { logout, user } = useAuth()
  const router = useRouter()
  const { openModal } = useModalProveedoresDesactivados()

  const items: MenuProps['items'] = [
    {
      key: '1',
      label: 'Mi Empresa',
      onClick: () => {
        router.push('/ui/configuracion/mi-empresa')
      }
    },
    {
      key: '2',
      label: 'Locaciones',
      children: [
        {
          key: '2-1',
          label: 'Locación 1',
        },
        {
          key: '2-2',
          label: 'Locación 2',
        },
      ],
    },
    {
      key: '3',
      label: 'Registros',
      children: [
        {
          key: '3-1',
          label: 'Registrar Usuario',
          onClick: () => {
            router.push('/ui/configuracion/usuarios')
          },
        },
        {
          key: '3-2',
          label: 'Registrar Producto',
        },
        {
          key: '3-3',
          label: 'Registrar Cliente',
        },
        {
          key: '3-4',
          label: 'Proveedores Desactivados',
          onClick: () => {
            openModal()
          },
        },
      ],
    },
   
    {
      key: '5',
      label: 'Cambiar mi Contraseña',
    },
    {
      key: '6',
      label: 'Cerrar Sesión',
      className: '!text-red-500',
      extra: <FaSignOutAlt className='text-red-500' />,
      onClick: async () => {
        await logout()
        window.location.href = '/'
      },
    },
  ]

  return (
    <>
      <DropdownBase
        menu={{ items }}
        className={`ml-auto
                    mt-3 mr-3 sm:mt-4 sm:mr-4 md:mt-6 md:mr-6 lg:mt-8 lg:mr-8
                    ${className}`}
        classNameDiv='border shadow-md
                      py-1 px-3 sm:py-1 sm:px-4 md:py-1 md:px-5 lg:py-1 lg:px-6
                      rounded-md bg-white hover:bg-gray-100 transition-all
                      text-xs sm:text-sm md:text-base
                      max-w-[calc(100vw-1.5rem)] sm:max-w-none
                      truncate'
      >
        <span className='hidden sm:inline'>Hola, {user?.empresa?.razon_social || 'Usuario'}</span>
        <span className='inline sm:hidden'>Hola, {user?.empresa?.razon_social?.substring(0, 3) || 'GMR'}</span>
      </DropdownBase>
      <ModalProveedoresDesactivados />
    </>
  )
}
